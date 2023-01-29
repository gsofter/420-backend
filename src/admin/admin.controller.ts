import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { BreedPairStatus, EventType } from '@prisma/client';
import {
  BadRequestError,
  BreedingError,
  ConflictRequestError,
  NotFoundError,
} from 'src/utils/errors';
import { UserService } from 'src/user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { BurnGen0Buds } from './dto/burn-gen0-buds.dto';
import { BreedingPointDto } from './dto/breeding-point.dto';
import { BudService } from 'src/bud/bud.service';
import { AppGateway } from 'src/app.gateway';
import { LandService } from 'src/land/land.service';
import { ADDRESSES } from 'src/config';
import { BuyLandDto } from './dto/buy-land.dto';
import { BreedService } from 'src/breed/breed.service';
import { AdminService } from './admin.service';
import { InvalidateBreedingDto } from './dto/invalidate-breeding.dto';
import { Throttle } from '@nestjs/throttler';
import { InvalidateSlotsDto } from './dto/invalidate-slots.dto';
import { Network } from 'src/types';

@Controller('admin')
@Throttle(60 * 1000, 60)
export class AdminController {
  private readonly logger = new Logger('AdminController');

  constructor(
    private readonly appGateway: AppGateway,
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    private readonly budService: BudService,
    private readonly breedService: BreedService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly landService: LandService,
  ) {}

  @UseGuards(AuthGuard('admin'))
  @Put('invalidate-breeding')
  async invalidateBreedingPairByBudId(@Body() body: InvalidateBreedingDto) {
    const { prevOwner, owner, budId } = body;

    await this.budService.isGen0BudOwner(budId, owner);

    const pairs = await this.prismaService.breedPair.findMany({
      where: {
        userAddress: prevOwner,
        status: BreedPairStatus.PAIRED,
        OR: [
          {
            femaleBudId: budId,
          },
          { maleBudId: budId },
        ],
      },
      select: {
        id: true,
        slotId: true,
      },
    });

    if (pairs.length === 0) {
      return {
        success: false,
        data: null,
      };
    }

    this.logger.log(
      `Bud TANSFER: Invalidate ${pairs.length} pairs that were in breeding`,
      JSON.stringify({
        data: pairs,
      }),
    );

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

    const count = pairs.length;
    return {
      success: true,
      data:
        (count > 1 ? `${count} pairs are ` : `${count} pair is `) +
        'invalidated',
    };
  }

  @UseGuards(AuthGuard('admin'))
  @Put('invalidate-slots')
  async invalidSlotsForGameKey(@Body() body: InvalidateSlotsDto) {
    const { prevOwner, owner, gameKeyId } = body;
    const network = this.configService.get<Network>('network.name');

    if (prevOwner === ADDRESSES[network].STAKING) {
      this.logger.log(`Game key #${gameKeyId} is being unstaked, skip invalidating`, { prevOwner, owner, gameKeyId });

      return {
        success: false,
        message: 'Skip invalidate, because game key is unstaked and could be staked again'
      }
    }

    if (owner === ADDRESSES[network].STAKING) {
      this.logger.log(`Game key #${gameKeyId} is being staked, skip invalidating`, { prevOwner, owner, gameKeyId });
      return {
        success: false,
        message: 'No need to invalidate because game key is to be staked'
      }
    }

    await this.budService.isGameKeyOwner(gameKeyId, owner);

    const slots = await this.prismaService.breedSlot.findMany({
      where: {
        userAddress: prevOwner,
        gameKeyId,
      },
      select: {
        id: true,
      }
    });

    if (slots.length === 0) {
      return {
        success: false,
        data: null,
      };
    }

    // Soft delete slots
    await this.prismaService.breedSlot.updateMany({
      where: {
        id: {
          in: slots.map((s) => s.id),
        },
      },
      data: {
        deletedAt: new Date(),
      }
    });

    // Update related pairs on those slots
    await this.prismaService.breedPair.updateMany({
      where: {
        slotId: {
          in: slots.map((s) => s.id),
        },
      },
      data: {
        status: BreedPairStatus.FAILED,
      },
    });

    this.logger.log(
      `Game Key TANSFER: Invalidate ${slots.length} slots that were used`,
      JSON.stringify({
        data: slots,
      }),
    );

    const count = slots.length;
    return {
      success: true,
      data:
        (count > 1 ? `${count} slots are ` : `${count} slot is `) +
        'invalidated',
    };
  }

  @UseGuards(AuthGuard('admin'))
  @Put('breedingPoint')
  async addBreedingPoint(@Body() body: BreedingPointDto) {
    const { address, txHash, block, network, amount } = body;    

    await this.adminService.validateTransaction({ address, txHash, block, network }, EventType.DEPOSIT_BP);

    const user = await this.prismaService.user.findUnique({
      where: { address },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    try {
      await this.prismaService.eventServiceLog.create({
        data: {
          address,
          txHash,
          blockNumber: block,
          type: EventType.DEPOSIT_BP,
          data: JSON.stringify({ amount, balance: user.breedingPoint }),
        },
      });

      // TODO: Verify txHash and actual event
      await this.prismaService.user.update({
        where: { address },
        data: {
          breedingPoint: user.breedingPoint + amount / 100,
        },
      });

      this.logger.log(
        `Add BreedingPoint: user - ${address}, points - ${amount}`,
      );

      return {
        success: true,
      };
    } catch (e) {
      this.logger.error('addBreedingPoint: ' + e.message, e);
    }

    return {
      success: false,
    };
  }

  @UseGuards(AuthGuard('admin'))
  @Put('withdrawBreedingPoint')
  async withdrawBreedingPoint(@Body() body: BreedingPointDto) {
    const { address, txHash, block, network, amount } = body;

    await this.adminService.validateTransaction({ address, txHash, block, network }, EventType.WITHDRAW_BP);

    const user = await this.prismaService.user.findUnique({
      where: { address },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    try {
      if (user.breedingPoint < amount / 100) {
        this.logger.error(
          `Insufficient balance: Withdraw BP from user - ${address}, points - ${amount}`,
        );
      }

      // TODO: Verify txHash and actual event
      await this.prismaService.user.update({
        where: { address },
        data: {
          breedingPoint: user.breedingPoint - amount / 100,
        },
      });

      await this.prismaService.eventServiceLog.create({
        data: {
          address,
          txHash,
          blockNumber: block,
          type: EventType.WITHDRAW_BP,
          data: JSON.stringify({ amount, balance: user.breedingPoint }),
        },
      });

      this.logger.log(
        `Withdraw BreedingPoint: user - ${address}, points - ${amount}`,
      );

      return {
        success: true,
      };
    } catch (e) {
      this.logger.error('withdrawBreedingPoint: ' + e.message, e);
    }

    return {
      success: false,
    };
  }


  @UseGuards(AuthGuard('admin'))
  @Post('burnBuds')
  async burnGen0Buds(@Body() body: BurnGen0Buds) {
    const { address, txHash, block, network, maleBudId, femaleBudId } = body;

    await this.adminService.validateTransaction({ address, txHash, block, network }, EventType.BURN_GEN0);

    const user = await this.prismaService.user.findUnique({
      where: { address },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    // TODO: Enable bud gender check and breeding status
    // TODO: Event verification

    await this.budService.verifyBudPairs(
      {
        address: ADDRESSES[network].BUD_BURN,
        maleBudId,
        femaleBudId,
      },
      { checkMetadata: true },
    );

    if (
      (await this.breedService.findPairInBreeding(maleBudId, femaleBudId)) > 0
    ) {
      throw ConflictRequestError('One of the bud pairs is in breeding');
    }

    // Roll the dice
    const result = this.budService.diceGen1Bud(
      this.configService.get<number>('breed.burnSuccessRate'),
    );

    const logData = {
      address,
      txHash,
      blockNumber: block,
      type: EventType.BURN_GEN0,
    };

    this.logger.log(
      `BURN Gen0 buds success: ${result.success}`, JSON.stringify({
        ...logData,
        result
      }),
    );

    if (result.success) {
      const newBud = await this.budService.issueGen1BudMint(
        address,
        result.data,
      );

      await this.prismaService.eventServiceLog.create({
        data: {
          ...logData,
          data: JSON.stringify({
            maleBudId,
            femaleBudId,
            gen1: { success: true, budId: newBud.id },
          }),
        },
      });

      this.appGateway.emitGen0BudsBurned({
        success: true,
        data: {
          address,
          maleBudId,
          femaleBudId,
          newBudId: newBud.id,
        },
      });

      return {
        success: true,
        data: newBud,
      };
    }

    await this.prismaService.eventServiceLog.create({
      data: {
        ...logData,
        data: JSON.stringify({
          maleBudId,
          femaleBudId,
          gen1: { success: false, budId: null },
        }),
      },
    });

    this.appGateway.emitGen0BudsBurned({
      success: false,
      data: {
        address,
      },
    });

    return {
      success: false,
      data: null,
    };
  }

  // @UseGuards(AuthGuard('admin'))
  // @Post('openLandSlots')
  // async openNewLandSlots(@Body() body: BuyLandDto) {
  //   const { address, txHash, block, network, landId } = body;

  //   await this.adminService.validateTransaction({ address, txHash, block, network }, EventType.MINT_LAND);

  //   try {
  //     await this.landService.createNewLandSlots(address, landId);

  //     await this.prismaService.eventServiceLog.create({
  //       data: {
  //         address,
  //         txHash,
  //         blockNumber: block,
  //         type: EventType.MINT_LAND,
  //         data: JSON.stringify({ landId }),
  //       },
  //     });

  //     return {
  //       success: true,
  //       data: null,
  //     };
  //   } catch (e) {
  //     this.logger.error('OpenLandSlots error: ' + e.message, e);
  //   }

  //   return {
  //     success: false,
  //     data: null,
  //   };
  // }

  @UseGuards(AuthGuard('admin'))
  @Get('gen1/:id')
  async getGen1Buds(@Param('id') id: number) {
    const budId = Number(id);

    if (isNaN(budId) || budId <= 0) {
      return {
        success: false,
        data: null,
      };
    }
    const bud = await this.prismaService.gen1Bud.findFirst({
      where: {
        id: budId,
      },
      select: {
        id: true,
        name: true,
        image: true,
        thc: true,
        budSize: true,
        gender: true,
        shine: true,
        color: true,
        createdAt: true,
        minterAddress: true,
      },
    });

    return {
      success: true,
      data: bud,
    };
  }
}
