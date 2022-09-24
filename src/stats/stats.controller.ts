import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
  Req,
} from '@nestjs/common';
import { isAddress } from 'ethers/lib/utils';
import { Request } from 'src/types';
import {
  CheckShopRequirementsDto,
  SearchBreederDto,
} from './dto/search-breeder.dto';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  private logger = new Logger('StatsController');

  constructor(private readonly statsService: StatsService) {}

  @Get('history')
  async getHistory(@Req() req: Request) {
    const userAddress = req.user;

    const bpDeposits = await this.statsService.getBPDepositHistory(userAddress);

    return {
      history: {
        bpDeposits,
      },
    };
  }

  @Get('metrics')
  async getMetrics(@Req() req: Request) {
    const user = await this.statsService.getUserMetrics();
    const slot = await this.statsService.getSlotMetrics();
    const breeding = await this.statsService.getBreedingMetrics();
    const topBreeders = await this.statsService.getTopBreeders();

    // TODO: Discuss with frontend if this helps, otherwise, this increases the latency of the endpoint because of extra RPC calls
    
    // const topBreederAddresses = topBreeders.map(
    //   (breeder) => breeder.minterAddress,
    // );
    // const lockCounts = await this.statsService.getGen0BudLockCounts(
    //   topBreederAddresses,
    // );
    // const gameItemMintCounts = await this.statsService.getGameItemMintCounts(
    //   topBreederAddresses,
    // );
    return {
      user,
      slot,
      breeding,
      topBreeders,
      // lockCounts,
      // gameItemMintCounts,
    };
  }

  @Get('searchBreeder')
  async searchBreeder(@Query() { address }: SearchBreederDto) {
    if (!isAddress(address)) {
      throw new BadRequestException(
        'address is not valid Ethereum address (must be checksumed)',
      );
    }

    const result = await this.statsService.getBreeder(address);

    return {
      breeder: result[0],
    };
  }

  @Get('shopRequirements')
  async checkShopRequirements(
    @Query() { addresses }: CheckShopRequirementsDto,
  ) {
    for (const address of addresses) {
      if (!isAddress(address)) {
        throw new BadRequestException(
          `${address} is not valid Ethereum address (must be checksumed)`,
        );
      }
    }

    const lockCounts = await this.statsService.getGen0BudLockCounts(addresses);
    const gameItemMintCounts = await this.statsService.getGameItemMintCounts(
      addresses,
    );

    const stats: Record<string, any> = {};

    for (let i = 0; i < addresses.length; i++) {
      stats[addresses[i]] = {
        lockCount: lockCounts[i],
        gameItemMintCount: gameItemMintCounts[i],
      };
    }
    return {
      stats,
    };
  }
}
