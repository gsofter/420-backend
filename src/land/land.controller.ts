import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Post,
  Put,
  Req,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { JsonRpcProvider } from '@ethersproject/providers';
import {
  BreedSlotType,
  BreedPairStatus,
} from '@prisma/client';
import { ethers } from 'ethers';
import { BudService } from 'src/bud/bud.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GameItem, Network, Request } from 'src/types';
import { UserService } from 'src/user/user.service';
import {
  BadRequestError,
  NotFoundError,
  UnproceesableEntityError,
} from 'src/utils/errors';
import { signMintRequest } from 'src/utils/onchain/sign';
import { OpenSlotDto, PurchaseGameItemDto } from './dto/land.dto';
import { LandService } from './land.service';
import { multicall } from 'src/utils/multicall';
import { ADDRESSES } from 'src/config';
import * as Gen0BudLockAbi from 'src/abis/gen0BudLock.json';

@Controller('lands')
export class LandController {
  private bpToOpen = 0;
  private bpForIndoor = 0;
  private rpcProvider: JsonRpcProvider;
  private network: Network;
  private readonly logger = new Logger('LandController');

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly budService: BudService,
    private readonly landService: LandService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    this.bpToOpen = this.configService.get<number>(
      'breed.breedingPointToOpenSlot',
    );
    this.bpForIndoor = this.configService.get<number>(
      'breed.breedingPointToCovertIndoor',
    );
    this.rpcProvider = new ethers.providers.StaticJsonRpcProvider(
      configService.get<string>('network.rpc'),
      configService.get<number>('network.chainId'),
    );
    this.network = this.configService.get<Network>('network.name');
  }

  @Get('slots')
  async getUserSlots(@Req() req: Request) {
    const { user } = req;

    const userLands = await this.prismaService.breedSlot.findMany({
      where: {
        userAddress: user,
      },
    });

    return {
      success: true,
      data: userLands,
    };
  }

  @Put('openSlot')
  async openSlot(@Req() req: Request, @Body() { slotId }: OpenSlotDto) {
    const { user } = req;

    let slot = await this.prismaService.breedSlot.findFirst({
      where: {
        id: slotId,
        userAddress: user,
      },
    });

    if (!slot) {
      throw NotFoundError('Slot not found');
    }

    if (slot.isOpen) {
      throw BadRequestError('Slot is already open');
    }

    // Consume breeding point
    await this.userService.consumeBreedingPoint(user, this.bpToOpen);

    // Update slot information
    slot = await this.prismaService.breedSlot.update({
      where: {
        id: slotId,
      },
      data: {
        isOpen: true,
      },
    });

    return {
      success: true,
      data: slot,
    };
  }

  @Put('convertIndoor')
  async convertIndoor(@Req() req: Request, @Body() { slotId }: OpenSlotDto) {
    const { user } = req;

    let slot = await this.prismaService.breedSlot.findFirst({
      where: {
        id: slotId,
        userAddress: user,
      },
    });

    if (!slot) {
      throw NotFoundError('Slot not found');
    }

    if (slot.type === BreedSlotType.INDOOR) {
      throw BadRequestError('This slot is already INDOOR type');
    }

    // Consume breeding point
    await this.userService.consumeBreedingPoint(user, this.bpForIndoor);

    // Update slot information
    slot = await this.prismaService.breedSlot.update({
      where: {
        id: slotId,
      },
      data: {
        type: BreedSlotType.INDOOR,
      },
    });

    return {
      success: true,
      data: slot,
    };
  }

  @Post('purchase')
  @Throttle(10, 60)
  async purchaseLand(@Req() req: Request) {
    const { user } = req;
    const bpPrice = this.configService.get<number>('land.price');
    const currentTimestamp = Date.now();

    await this.userService.consumeBreedingPoint(user, bpPrice);

    // meant to use random id
    await this.landService.createNewLandSlots(user, currentTimestamp);

    const purchasedLands = await this.prismaService.breedSlot.findMany({
      where: {
        userAddress: user,
        landTokenId: currentTimestamp,
      },
    });

    const userObject = await this.prismaService.user.findUnique({
      where: { address: user },
    });

    return {
      success: true,
      data: {
        purchasedLands,
        user: {
          breedingPoint: userObject.breedingPoint,
        },
      },
    };
  }

  @Post('roll-paper')
  @Throttle(10, 60)
  async purchaseRollPaper(
    @Req() req: Request,
    @Body() { amount }: PurchaseGameItemDto,
  ) {
    const timestamp = Date.now();

    const burnCount = await this.prismaService.eventServiceLog.count({
      where: {
        address: req.user,
        type: 'BURN_GEN0',
      },
    });

    let [burnAmount] = [0];
    try {
      [burnAmount] = await multicall(
        this.rpcProvider,
        ADDRESSES[this.network].MULTICALL,
        Gen0BudLockAbi,
        [
          {
            contractAddress: ADDRESSES[this.network].BUD_BURN,
            functionName: 'burntAmount',
            params: [req.user],
          },
        ],
      );
      burnAmount = Number(burnAmount);
    } catch (e) {
      this.logger.error('Gen0BudLock.burntAmount multicall error: ' + e.message, e);
    }

    this.logger.log('Mint roll-paper, check burn amount', { burnAmount, burnCount, address: req.user});

    if (burnCount < 2 && burnAmount < 2) {
      throw UnproceesableEntityError(
        `Not matching burn requirement (at least 2 sessions)`,
      );
    }

    const signature = await signMintRequest(
      req.user,
      'GameItem',
      GameItem.ROLLING_PAPER,
      amount,
      timestamp,
    );

    return {
      success: true,
      data: {
        signature,
        amount,
        timestamp,
      },
    };
  }

  @Post('hoodie')
  @Throttle(10, 60)
  async purchaseHoodie(
    @Req() req: Request,
    @Body() { amount }: PurchaseGameItemDto,
  ) {
    const timestamp = Date.now();
    const signature = await signMintRequest(
      req.user,
      'GameItem',
      GameItem.HOODIE,
      amount,
      timestamp,
    );

    return {
      success: true,
      data: {
        signature,
        amount,
        timestamp,
      },
    };
  }

  @Post('weed-dr-pass')
  @Throttle(10, 60)
  async purchaseWeedDrPass(
    @Req() req: Request,
    @Body() { amount }: PurchaseGameItemDto,
  ) {
    const timestamp = Date.now();
    const signature = await signMintRequest(
      req.user,
      'GameItem',
      GameItem.WEED_DR_PASS,
      amount,
      timestamp,
    );

    return {
      success: true,
      data: {
        signature,
        amount,
        timestamp,
      },
    };
  }

  @Post('farmer-pass')
  @Throttle(10, 60)
  async purchaseFarmerPass(
    @Req() req: Request,
    @Body() { amount }: PurchaseGameItemDto,
  ) {
    const completedCount = await this.prismaService.breedPair.count({
      where: {
        userAddress: req.user,
        status: BreedPairStatus.COMPLETED,
      },
    });

    if (completedCount <= 3) {
      throw UnproceesableEntityError(
        `Not completed 4 successful breeding sessions`,
      );
    }

    const timestamp = Date.now();
    const signature = await signMintRequest(
      req.user,
      'GameItem',
      GameItem.FARMER_PASS,
      amount,
      timestamp,
    );

    return {
      success: true,
      data: {
        signature,
        amount,
        timestamp,
      },
    };
  }

  @Post('superweed-serum')
  @Throttle(10, 60)
  async purchaseSuperWeedSerum(
    @Req() req: Request,
    @Body() { amount }: PurchaseGameItemDto,
  ) {
    const timestamp = Date.now();
    const signature = await signMintRequest(
      req.user,
      'GameItem',
      GameItem.SUPERWEED_SERUM,
      amount,
      timestamp,
    );

    return {
      success: true,
      data: {
        signature,
        amount,
        timestamp,
      },
    };
  }
}
