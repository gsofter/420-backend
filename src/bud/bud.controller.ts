import { Body, Controller, Get, Logger, Put, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Request } from 'src/types';
import { NotFoundError, UnproceesableEntityError } from 'src/utils/errors';
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
    const bud = await this.prismaService.gen1Bud.findFirst({
      where: {
        id: budId,
        minterAddress: req.user,
      },
    });

    if (!bud) {
      throw NotFoundError('Bud not found.');
    }

    const limit = this.configService.get<number>('bud.renameAllowedTime'); // milliseconds

    if (bud.createdAt.getTime() + limit < Date.now()) {
      throw UnproceesableEntityError('Rename too late.');
    }

    // Verify bud name
    const isValid = await this.checkBudName(name);

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
      };
    }

    throw UnproceesableEntityError('Proposed bud name cannot be accepted or duplicated. Please try the other one');
  }

  private async checkBudName(name: string) {
    const exists = await this.prismaService.gen1Bud.count({
      where: {
        name
      }
    });

    if (exists > 0) {
      return false;
    }

    try {
      const apiKey = this.configService.get<string>('metadataApi.key');
      const network = this.configService.get<string>('network.name');

      const url = `https://420${network === 'rinkeby' ? '-dev' : ''}.looklabs.xyz/${network === 'rinkeby' ? 'dev/' : ''}checkBudName`;

      const response = await axios.get(`${url}?budName=${name}`, {
        headers: {
          'X-Api-Key': apiKey
        }
      });

      return response.data[0].valid;
    } catch (e) {
      this.logger.error('Bud name check API error: ' + e.message, e);
    }

    return false;
  }
}
