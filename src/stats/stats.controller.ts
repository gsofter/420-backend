import { Controller, Get, Logger, Req } from '@nestjs/common';
import { Request } from 'src/types';
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
    const userAddress = req.user;
    const user = await this.statsService.getUserMetrics();
    const slot = await this.statsService.getSlotMetrics();
    const breeding = await this.statsService.getBreedingMetrics();
    const topBreeders = await this.statsService.getTopBreeders();
    
    return {
      userAddress,
      user,
      slot,
      breeding,
      topBreeders
    }
  }
}
