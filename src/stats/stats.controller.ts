import { BadRequestException, Controller, Get, Logger, Query, Req } from '@nestjs/common';
import { isAddress } from 'ethers/lib/utils';
import { Request } from 'src/types';
import { SearchBreederDto } from './dto/search-breeder.dto';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  private logger = new Logger('StatsController');

  constructor(
    private readonly statsService: StatsService
  ) {

  }

  @Get('history')
  async getHistory(@Req() req: Request) {
    const userAddress = req.user;

    const bpDeposits = await this.statsService.getBPDepositHistory(userAddress);

    return {
      history: {
        bpDeposits
      }
    }
  }

  @Get('metrics')
  async getMetrics(@Req() req: Request) {
    const user = await this.statsService.getUserMetrics();
    const slot = await this.statsService.getSlotMetrics();
    const breeding = await this.statsService.getBreedingMetrics();
    const topBreeders = await this.statsService.getTopBreeders();
    
    return {
      user,
      slot,
      breeding,
      topBreeders
    }
  }

  @Get('searchBreeder')
  async searchBreeder(@Query() { address }: SearchBreederDto) {
    if (!isAddress(address)) {
      throw new BadRequestException('address is not valid Ethereum address (must be checksumed)');
    }

    const result = await this.statsService.getBreeder(address);
    
    return {
      breeder: result[0]
    }
  }

  // @Get('breeders')
  // async getBreeders(@Req() req: Request) {
  //   const topBreeders = await this.statsService.getTopBreeders();
    
  //   return {
  //     topBreeders
  //   }
  // }
}
