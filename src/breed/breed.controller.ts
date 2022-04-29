import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'src/types';
import {
  BadRequestError,
  BreedingError,
  ConflictRequestError,
  isPrismaError,
  NotFoundError,
} from 'src/utils/errors';
import { BreedService } from './breed.service';
import { BreedPairQueryDto, CreateBreedPairDto } from './dto/breed-pair.dto';
import { BreedUpDto } from './dto/breed-up.dto';
import { getBonusRateStatus } from './../utils/breed';
import { BreedPairDto } from './dto/breed.dto';
import { ConfigService } from '@nestjs/config';
import { BreedPairStatus } from '@prisma/client';

@Controller('breeds')
@UseInterceptors(ClassSerializerInterceptor)
export class BreedController {
  private logger = new Logger('BreedController');
  private breedTime = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly breedService: BreedService,
    private readonly prismaService: PrismaService,
  ) {
    this.breedTime = this.configService.get<number>('breed.timePeriod');
  }

  // TODO: Pagination, includeOptions, etc.
  @Get('pairs')
  async getPairs(@Req() req: Request, @Query() { pairId }: BreedPairQueryDto) {
    const user = req.user;
    const pairs = await this.prismaService.breedPair.findMany({
      where: {
        userAddress: user,
        id: pairId,
      },
      include: {
        levels: {
          include: {
            buds: true,
          },
        },
      },
    });
    
    return {
      success: true,
      data: pairs.map((pair) => new BreedPairDto(pair, this.breedTime)),
    };
  }

  @Post('pair')
  async createPair(@Req() req: Request, @Body() body: CreateBreedPairDto) {
    const user = req.user;
    const dtoWithUser = { ...body, address: user };

    try {
      await this.breedService.verifyBudPairs(dtoWithUser, {
        checkMetadata: true,
      });
    } catch (e) {
      throw BadRequestError(e.message);
    }

    if (
      await this.breedService.findPairInBreeding(
        body.maleBudId,
        body.femaleBudId,
      ) > 0
    ) {
      throw ConflictRequestError('One of the bud pairs is in breeding');
    }

    try {
      // Determine the start success rate
      const startSuccessRate = await this.breedService.getStartSuccessRate(
        dtoWithUser,
      );
      const pair = await this.prismaService.breedPair.create({
        data: {
          userAddress: user,
          maleBudId: body.maleBudId,
          femaleBudId: body.femaleBudId,
          rate: startSuccessRate,
          status: BreedPairStatus.PAIRED,
        },
      });

      // Create level 1 buds
      await this.breedService.startBreedLevel(pair);

      return {
        success: true,
        data: new BreedPairDto(pair, this.breedTime),
      };
    } catch (e) {
      this.logger.error('createPair', e);
      if (isPrismaError(e)) {
        throw BreedingError();
      }
      throw e;
    }
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
      },
    });

    if (!pair) {
      throw NotFoundError('Breed pair not found');
    }

    // Verify the original pair status again..
    // People might have transferred/sold the buds in the meantime
    try {
      await this.breedService.verifyBudPairs(
        {
          address: pair.userAddress,
          maleBudId: pair.maleBudId,
          femaleBudId: pair.femaleBudId,
        },
        { checkMetadata: false },
      );
    } catch (e) {
      throw BadRequestError('Breed pair status changed: ' + e.message);
    }

    try {
      // Get the bonus rate for the current level
      const bonusRate = await this.breedService.advanceBreedLevel(pair, budIds);

      // Generate the next level buds
      await this.breedService.startBreedLevel(pair);

      return {
        success: true,
        data: {
          status: getBonusRateStatus(bonusRate),
        },
      };
    } catch (e) {
      this.logger.error('levelUp', e);
      if (isPrismaError(e)) {
        throw BreedingError();
      }
      throw e;
    }
  }
}
