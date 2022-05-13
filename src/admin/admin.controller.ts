import { BreedingPointDto } from './dto/breeding-point.dto';
import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Logger,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { verifyMessage } from 'ethers/lib/utils';
import type { Request } from 'src/types';
import {
  BadRequestError,
  BreedingError,
  ConflictRequestError,
  NotFoundError,
} from 'src/utils/errors';
import { UserService } from 'src/user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BurnGen0Buds } from './dto/burn-gen0-buds.dto';
import { BudService } from 'src/bud/bud.service';
import { ethers } from 'ethers';
import { BreedPairStatus } from '@prisma/client';
import { AppGateway } from 'src/app.gateway';
import { LandService } from 'src/land/land.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger('AdminController');

  constructor(
    private readonly appGateway: AppGateway,
    private readonly userService: UserService,
    private readonly budService: BudService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly landService: LandService,
  ) {}

  @UseGuards(AuthGuard('admin'))
  @Put('breedingPoint')
  async addBreedingPoint(@Body() body: BreedingPointDto) {
    const { address, txHash, block, network, amount } = body;

    if (network !== this.configService.get<string>('network.name')) {
      throw BadRequestError('Invalid network');
    }

    const user = await this.prismaService.user.findUnique({
      where: { address },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    try {
      // TODO: Verify txHash and actual event
      await this.prismaService.user.update({
        where: { address },
        data: {
          breedingPoint: user.breedingPoint + amount,
        },
      });

      await this.prismaService.breedingPointLog.create({
        data: {
          userAddress: address,
          txHash,
          block,
          amount,
        },
      });

      return {
        success: true,
      };
    } catch (e) {
      this.logger.error('addBreedingPoint: ' + e.message);
    }

    return {
      success: false,
    };
  }

  @UseGuards(AuthGuard('admin'))
  @Post('burnBuds')
  async burnGen0Buds(@Body() body: BurnGen0Buds) {
    const { address, txHash, block, network, maleBudId, femaleBudId } = body;

    if (network !== this.configService.get<string>('network.name')) {
      throw BadRequestError('Invalid network');
    }

    const user = await this.prismaService.user.findUnique({
      where: { address },
    });

    if (!user) {
      throw NotFoundError('User not found.');
    }

    // TODO: Enable bud gender check and breeding status
    // TODO: Event verification

    // await this.budService.verifyBudPairs(
    //   {
    //     address: ethers.constants.AddressZero,
    //     maleBudId,
    //     femaleBudId,
    //   },
    //   { checkMetadata: true },
    // );

    // if (
    //   (await this.prismaService.breedPair.count({
    //     where: {
    //       status: BreedPairStatus.PAIRED,
    //       OR: [
    //         {
    //           femaleBudId: femaleBudId,
    //         },
    //         { maleBudId: maleBudId },
    //       ],
    //     },
    //   })) > 0
    // ) {
    //   throw ConflictRequestError('One of the bud pairs is in breeding');
    // }

    // Roll the dice
    const result = this.budService.diceGen1Bud(
      this.configService.get<number>('breed.burnSuccessRate'),
    );

    if (result.success) {
      const newBud = await this.budService.issueGen1BudMint(address, result.data);

      this.appGateway.emitGen0BudsBurned({
        success: true,
        data: {
          address,
          maleBudId,
          femaleBudId,
          newBudId: newBud.id,
        }
      });

      return {
        success: true,
        data: newBud,
      };
    }

    this.appGateway.emitGen0BudsBurned({
      success: false,
      data: null
    });

    return {
      success: false,
      data: null,
    };
  }

  @UseGuards(AuthGuard('admin'))
  @Post('openLandSlots')
  async openNewLandSlots() {
    // TODO: To be implemented
    return "To be implemented";
  }
}
