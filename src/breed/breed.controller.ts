import { Body, ClassSerializerInterceptor, Controller, Get, Logger, Post, Query, Req, UseInterceptors } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'src/types';
import { BadRequestError, BreedingError, ConflictRequestError, NotFoundError } from 'src/utils/errors';
import { BreedService } from './breed.service';
import { BreedPairQueryDto, CreateBreedPairDto } from './dto/breed-pair.dto';
import { BreedUpDto } from './dto/breed-up.dto';
import { getBonusRateStatus } from './../utils/breed';
import { BreedPairDto } from './dto/breed.dto';
import { ConfigService } from '@nestjs/config';

@Controller('breeds')
@UseInterceptors(ClassSerializerInterceptor)
export class BreedController {
  private logger = new Logger('BreedController');
  private breedTime = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly breedService: BreedService,
    private readonly prismaService: PrismaService,
  ) {
    this.breedTime = this.configService.get<number>('breed.timePeriod');
  }

  // TODO: Pagination, includeOptions, etc.
  @Get('pairs')
  async getPairs(@Req() req: Request, @Query() { pairId }: BreedPairQueryDto) {
    const user = req.user;
    const pairs = await this.prismaService.breedPair.findMany({
      where: {
        userAddress: user,
        id: pairId
      },
      include: {
        levels: {
          include: {
            buds: true
          }
        }
      }
    });

    return {
      success: true,
      data: pairs.map(pair => new BreedPairDto(pair, this.breedTime)),
    };
  }

  @Post('pair')
  async createPair(@Req() req: Request, @Body() body: CreateBreedPairDto) {
    const user = req.user;
    const dtoWithUser = { ...body, address: user };

    try {
      await this.breedService.verifyBudPairs(dtoWithUser);
    } catch (e) {
      throw BadRequestError(e.message);
    }

    const result = await this.prismaService.breedPair.findUnique({
      where: {
        maleBudId_femaleBudId: {
          maleBudId: body.maleBudId,
          femaleBudId: body.femaleBudId,
        },
      },
    });

    if (result) {
      throw ConflictRequestError('Breed pair already exists');
    }

    // TODO: Also, check one of the buds is already in a breeding pair

    const startSuccessRate = await this.breedService.getStartSuccessRate(dtoWithUser);
    const pair = await this.prismaService.breedPair.create({
      data: {
        userAddress: user,
        maleBudId: body.maleBudId,
        femaleBudId: body.femaleBudId,
        rate: startSuccessRate,
      },
    });

    // Create level 1 buds
    await this.breedService.startBreedLevel(pair);

    return {
      success: true,
      data: new BreedPairDto(pair, this.breedTime),
    };
  }

  @Post('levelUp')
  async levelBreedingUp(@Req() req: Request, @Body() { pairId, ...budIds }: BreedUpDto) {
    const pair = await this.prismaService.breedPair.findFirst({
      where: {
        id: pairId,
      },
    });

    if (!pair) {
      throw NotFoundError('Breed pair not found');
    }

    try {
      // Get the bonus rate for the current level
      const bonusRate = await this.breedService.advanceBreedLevel(pair, budIds);

      // Generate the next level buds
      await this.breedService.startBreedLevel(pair);

      return {
        success: true,
        data: {
          status: getBonusRateStatus(bonusRate),
        }
      }
    } catch (e) {
      throw BreedingError(e.message)
    }
  }
}
