import { Controller, Get, Logger, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'src/types';
import { GiftCardQueryDto } from './dto/gift-card-query.dto';

@Controller('giftCards')
export class GiftCardController {
  private readonly logger = new Logger('GiftCardController');

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get('')
  async getGiftCards(
    @Req() req: Request,
    @Query() { id, value }: GiftCardQueryDto,
  ) {
    const giftCard = await this.prismaService.giftCard.findMany({
      where: {
        id,
        value,
        minterAddress: req.user,
      },
    });

    return {
      success: true,
      data: giftCard,
    };
  }
}
