import { Controller, Get, Req } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'src/types';

@Controller('buds')
export class BudController {

  constructor(
    private readonly prismaService: PrismaService,
  ) {}
  
  @Get('gen1')
  async getGen1Buds(@Req() req: Request) {
    const buds = await this.prismaService.gen1Bud.findMany({
      where: {
        minterAddress: req.user,
      },
    });

    return {
      success: true,
      data: buds,
    };
  }
}
