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

  @Get('metrics')
  async getMetrics(@Req() req: Request) {
    const user = req.user;
    const count = await this.statsService.getUserMetrics();
    
    return {
      user: {
        count
      }
    }
  }
}
