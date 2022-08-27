import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'src/types';
import {
  BadRequestError,
  ConflictRequestError,
  NotFoundError,
} from 'src/utils/errors';
import { BreedService } from './breed.service';
import {
  BreedPairQueryDto,
  CreateBreedPairDto,
  InvalidBreedPairDto,
} from './dto/breed-pair.dto';
import { BreedUpDto } from './dto/breed-up.dto';
import { getBonusRateStatus } from './../utils/breed';
import { BreedPairDto } from './dto/breed.dto';
import { ConfigService } from '@nestjs/config';
import { BreedPairStatus } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { BreedFinalizeDto, BreedCancelDto } from './dto/breed-finalize.dto';
import { BudService } from 'src/bud/bud.service';
import { LandService } from 'src/land/land.service';
import { GiftCardService } from 'src/gift-card/gift-card.service';
import { Throttle } from '@nestjs/throttler';

@Controller('breeds')
@UseInterceptors(ClassSerializerInterceptor)
export class BreedController {
  private logger = new Logger('BreedController');
  private breedTime = 0;
  private breedTargetLevel = 0;
  private breedingPointPerLevel = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly breedService: BreedService,
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly budService: BudService,
    private readonly landService: LandService,
    private readonly giftCardService: GiftCardService,
  ) {
    this.breedTime = this.configService.get<number>('breed.timePeriod');
    this.breedTargetLevel = this.configService.get<number>('breed.targetLevel');
    this.breedingPointPerLevel = this.configService.get<number>(
      'breed.breedingPointPerLevel',
    );
  }

  // TODO: Pagination, includeOptions, etc.
  @Get('pairs')
  async getPairs(@Req() req: Request, @Query() { pairId }: BreedPairQueryDto) {
    const user = req.user;
    const pairs = await this.prismaService.breedPair.findMany({
      where: {
        userAddress: user,
        id: pairId,
        // status: includePastBreeding ? undefined : BreedPairStatus.PAIRED,
      },
      include: {
        levels: {
          include: {
            buds: true,
          },
          orderBy: {
            level: 'asc',
          },
        },
      },
    });

    return {
      success: true,
      data: pairs.map((pair) => new BreedPairDto(pair, this.breedTime)),
    };
  }

  @Get('pairs/all')
  // TODO: Deprecate this.. because of performance issue
  async getAllBreedingPairs(@Req() req: Request) {
    const pairs = await this.prismaService.breedPair.findMany({
      where: {
        status: BreedPairStatus.PAIRED,
      },
    });

    return {
      success: true,
      data: pairs.map((pair) => new BreedPairDto(pair, this.breedTime)),
    };
  }

  @Put('invalidate')
  @Throttle(5, 60)
  async validatePair(@Req() req: Request, @Body() body: InvalidBreedPairDto) {
    const user = req.user;
    const { maleBudId, femaleBudId } = body;

    await this.budService.verifyBudPairs({
      address: user,
      maleBudId,
      femaleBudId,
    });

    // Find pairs
    const pairs = await this.prismaService.breedPair.findMany({
      where: {
        userAddress: {
          not: user,
        },
        status: BreedPairStatus.PAIRED,
        OR: [
          {
            femaleBudId: femaleBudId,
          },
          { maleBudId: maleBudId },
        ],
      },
    });

    const count = pairs.length;

    if (count === 0) {
      return {
        success: false,
        data: null,
      };
    }

    // Update pairs
    await this.prismaService.breedPair.updateMany({
      where: {
        id: {
          in: pairs.map((p) => p.id),
        },
      },
      data: {
        status: BreedPairStatus.FAILED,
      },
    });

    // Update slots
    await this.prismaService.breedSlot.updateMany({
      where: {
        id: {
          in: pairs.map((p) => p.slotId),
        },
      },
      data: {
        isUsed: false,
      },
    });

    if (count > 0) {
      return {
        success: true,
        data:
          (count > 1 ? `${count} pairs are ` : `${count} pair is `) +
          'invalidated',
      };
    }
  }

  @Post('pair')
  async createPair(@Req() req: Request, @Body() body: CreateBreedPairDto) {
    const user = req.user;
    const gameKeyId = req.gameKeyId;
    const dtoWithUser = { ...body, address: user };

    const [maleBud, femaleBud] = await this.budService.verifyBudPairs(
      dtoWithUser,
      {
        checkMetadata: true,
      },
    );

    if (body.gameItemId) {
      await this.breedService.checkGameItemBalance(user, body.gameItemId, 1);
    }

    if (
      (await this.breedService.findPairInBreeding(
        body.maleBudId,
        body.femaleBudId,
      )) > 0
    ) {
      throw ConflictRequestError('One of the bud pairs is in breeding');
    }

    const slot = await this.landService.findOpenBreedSlotById(
      user,
      body.slotId,
    );

    if (!slot || (slot.gameKeyId && slot.gameKeyId !== gameKeyId)) {
      throw BadRequestError(
        'Given slot is not open, not yours or being used for the other pair',
      );
    }

    // Determine the start success rate
    const startSuccessRate = await this.breedService.getStartSuccessRate(
      dtoWithUser,
      slot,
    );
    const pair = await this.prismaService.breedPair.create({
      data: {
        userAddress: user,
        gameKeyId,
        maleBudId: body.maleBudId,
        femaleBudId: body.femaleBudId,
        rate: startSuccessRate,
        status: BreedPairStatus.PAIRED,
        slotId: body.slotId,
        gameItemId: body.gameItemId,
      },
    });

    // Update slot status as Used
    await this.prismaService.breedSlot.update({
      where: {
        id: body.slotId,
      },
      data: {
        isUsed: true,
      },
    });

    // Create level 1 buds
    await this.breedService.startBreedLevel(pair, maleBud, femaleBud);

    return {
      success: true,
      data: new BreedPairDto(pair, this.breedTime),
    };
  }

  @Post('levelUp')
  async levelBreedingUp(
    @Req() req: Request,
    @Body() { pairId, ...budIds }: BreedUpDto,
  ) {
    const pair = await this.prismaService.breedPair.findFirst({
      where: {
        id: pairId,
        userAddress: req.user,
        status: BreedPairStatus.PAIRED,
      },
    });

    if (!pair) {
      throw NotFoundError('Breed pair not found');
    }

    if (pair.currentLevel > this.breedTargetLevel) {
      throw BadRequestError('Target level reached. Do finalize!');
    }

    // Used to verify if user still owns the game item used in the pair
    await this.breedService.verifyGameItemPosession(pair);

    // Verify the original pair status again..
    // People might have transferred/sold the buds in the meantime
    await this.budService.verifyBudPairs(
      {
        address: pair.userAddress,
        maleBudId: pair.maleBudId,
        femaleBudId: pair.femaleBudId,
      },
      { checkMetadata: false },
    );

    // Update breeding point balance
    await this.userService.consumeBreedingPoint(
      req.user,
      this.breedingPointPerLevel,
    );

    // Get the bonus rate for the current level
    const { bonusRate, maleBud, femaleBud } =
      await this.breedService.evaluateBreedLevel(pair, budIds);

    // Generate the next level buds
    await this.breedService.startBreedLevel(pair, maleBud, femaleBud);

    return {
      success: true,
      data: {
        status: getBonusRateStatus(bonusRate),
      },
    };
  }

  @Post('cancel')
  async cancelBreeding(
    @Req() req: Request,
    @Body() { pairId }: BreedCancelDto,
  ) {
    const pair = await this.prismaService.breedPair.findFirst({
      where: {
        id: pairId,
        userAddress: req.user,
        status: BreedPairStatus.PAIRED,
      },
    });

    if (!pair) {
      throw NotFoundError('Breed pair not found');
    }

    // Update breed pair as CANCELED
    await this.prismaService.breedPair.update({
      where: {
        id: pair.id,
      },
      data: {
        status: BreedPairStatus.CANCELED,
      },
    });

    // Mark slot unused
    await this.prismaService.breedSlot.update({
      where: {
        id: pair.slotId,
      },
      data: {
        isUsed: false,
      },
    });

    return {
      success: true,
      data: null,
    };
  }

  @Post('finalize')
  async finalizeBreeding(
    @Req() req: Request,
    @Body() { pairId, maleBudId, femaleBudId }: BreedFinalizeDto,
  ) {
    const pair = await this.prismaService.breedPair.findFirst({
      where: {
        id: pairId,
        userAddress: req.user,
        status: BreedPairStatus.PAIRED,
      },
    });

    if (!pair) {
      throw NotFoundError('Breed pair not found');
    }

    if (pair.currentLevel < this.breedTargetLevel) {
      throw BadRequestError('Breed target level not reached');
    }

    await this.breedService.evaluateBreedLevel(pair, {
      maleBudId,
      femaleBudId
    });

    const result = await this.breedService.finalizeBreeding(pair);

    // Update slot status as NotUsed
    await this.prismaService.breedSlot.update({
      where: {
        id: pair.slotId,
      },
      data: {
        isUsed: false,
      },
    });

    // TODO: if data.success is true, then we should
    // 1. upate pair.status === FINALIZED
    // 2. Record the bud metadata, and return a random request id
    await this.prismaService.breedPair.update({
      where: {
        id: pairId,
      },
      data: {
        status: result.success
          ? BreedPairStatus.COMPLETED
          : BreedPairStatus.FAILED,
      },
    });

    if (result.success) {
      let slot = await this.prismaService.breedSlot.findFirst({
        where: {
          userAddress: req.user,
          isOpen: false,
        },
      });

      if (slot) {
        slot = await this.prismaService.breedSlot.update({
          where: {
            id: slot.id,
          },
          data: {
            isOpen: true,
          },
        });
      }

      const gen1Bud = await this.budService.issueGen1BudMint(
        req.user,
        result.data,
        pair.id,
      );

      return {
        success: true,
        data: {
          type: 'BUD',
          bud: gen1Bud,
          slot,
        },
      };
    }

    // // Try to get a git card
    // const giftCard = await this.giftCardService.dice(req.user, pair.id);

    // if (giftCard) {
    //   return {
    //     success: true,
    //     data: {
    //       type: 'GIFT_CARD',
    //       giftCard,
    //     },
    //   };
    // }

    return {
      success: false,
      data: null,
    };
  }
}
