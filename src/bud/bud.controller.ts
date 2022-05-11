import { Body, Controller, Get, Logger, Put, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'src/types';
import { BreedingError, isPrismaError } from 'src/utils/errors';
import { Gen1BudQueryDto } from './dto/gen1-query.dto';
import { RenameGen1BudDto } from './dto/rename-bud.dto';

@Controller('buds')
export class BudController {
  private readonly logger = new Logger('BudController');

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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

  @Put('rename')
  async renameGen1Buds(
    @Req() req: Request,
    @Body() { budId, name }: RenameGen1BudDto,
  ) {
    try {
      const bud = await this.prismaService.gen1Bud.findFirst({
        where: {
          id: budId,
          minterAddress: req.user,
        },
      });
  
      if (!bud) {
        throw new Error('Bud not found.');
      }
  
      const limit = this.configService.get<number>('bud.renameAllowedTime'); // milliseconds
  
      if (bud.createdAt.getTime() + limit < Date.now()) {
        throw new Error('Rename too late.');
      }
  
      // Verify bud name
      const isValid = true;
  
      if (isValid) {
        const bud = await this.prismaService.gen1Bud.update({
          where: {
            id: budId,
          },
          data: {
            name,
          },
        });
  
        return {
          success: true,
          data: bud,
        }
      }
    } catch (e) {
      if (isPrismaError(e)) {
        this.logger.error('finalize', e);
        throw BreedingError();
      }
    }
    return {
      success: false,
      data: null,
    };
  }
}
