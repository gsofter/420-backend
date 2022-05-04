import { Controller, Get, Query, Req } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'src/types';
import { Gen1BudQueryDto } from './dto/gen1-query.dto';

@Controller('buds')
export class BudController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('gen1')
  async getGen1Buds(@Req() req: Request, @Query() { budId }: Gen1BudQueryDto) {
    const buds = await this.prismaService.gen1Bud.findMany({
      where: {
        id: budId,
        minterAddress: req.user,
      },
    });

    return {
      success: true,
      data: buds,
    };
  }
}
