import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateBudPair } from './breed.types';
import { generateRandomBud } from './../utils/bud';
import { BudService } from 'src/bud/bud.service';
import { HashTableService } from 'src/hash-table/hash-table.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BreedPair, BreedPairStatus } from '@prisma/client';

@Injectable()
export class BreedService {
  private readonly logger = new Logger('BreedService');
  private breedTargetLevel = 0;

  constructor(
    private configService: ConfigService,
    private budService: BudService,
    private hashTableService: HashTableService,
    private prismaService: PrismaService,
  ) {
    this.breedTargetLevel = configService.get<number>('breed.targetLevel');
  }

  /**
   * TBD - not implemented yet
   * This will return the start success rate for the pair. Dependent on the in-game items user holds
   *
   * @param address user address
   * @returns rate
   */
  async getStartSuccessRate({
    address,
    maleBudId,
    femaleBudId,
  }: CreateBudPair) {
    const baseSuccessRate = this.configService.get<number>(
      'breed.baseSuccessRate',
    );

    // Get bud metadatas
    const metadatas = await this.budService.getMetadatas([
      maleBudId,
      femaleBudId,
    ]);

    let bonusRate = 0;
    for (const metadata of metadatas) {
      bonusRate += this.hashTableService.lookUpBeginningSuccessRate({
        thcId: metadata.thc,
        budSize: metadata.budSize,
      });
    }

    // TODO: Add bouns rate if user owns eligible in-game items

    return baseSuccessRate + bonusRate;
  }

  /**
   * Return a pair where given femaleBudId or maleBudId is in breeding
   *
   * @param maleBudId number
   * @param femaleBudId number
   * @returns BreedPair
   */
  async findPairInBreeding(maleBudId: number, femaleBudId: number) {
    return this.prismaService.breedPair.count({
      where: {
        status: BreedPairStatus.PAIRED,
        OR: [
          {
            femaleBudId: femaleBudId,
          },
          { maleBudId: maleBudId },
        ],
      },
    });
  }

  /**
   * Start a new breed level - creating 4 random buds
   *
   * TODO: Verify time elapsed since last breeding
   *
   * @param breedPair BreedPair
   * @returns Promise<BreedLevel>
   */
  async startBreedLevel(breedPair: BreedPair) {
    const newLevel = breedPair.currentLevel + 1;
    const maxLevelReached = newLevel >= this.breedTargetLevel;

    // Max level reached
    if (!maxLevelReached) {
      const buds = [
        generateRandomBud({ targetGender: 'M' }),
        generateRandomBud({ targetGender: 'F' }),
        generateRandomBud({ targetGender: 'F' }),
        generateRandomBud({ targetGender: 'M' }),
      ];

      const breedLevel = await this.prismaService.breedLevel.create({
        data: {
          level: newLevel,
          pairId: breedPair.id,
          bonusRate: 0,
        },
      });
  
      // Create buds
      await this.prismaService.breedBud.createMany({
        data: buds.map((bud) => ({ ...bud, levelId: breedLevel.id, gen: 0 })),
      });
    }

    // Update breed pair
    await this.prismaService.breedPair.update({
      where: {
        id: breedPair.id,
      },
      data: maxLevelReached ? {
        status: BreedPairStatus.MAX_REACHED,
        currentLevel: newLevel,
      } : {
        currentLevel: newLevel,
      },
    });
  }

  /**
   * Advance to the next level if required time elapsed, get the positive or negative rate
   *
   * @param breedPair BreedPair
   * @param param1 { maleBudId, femaleBudId }
   */
  async advanceBreedLevel(
    breedPair: BreedPair,
    { maleBudId, femaleBudId }: Omit<CreateBudPair, 'address'>,
  ) {
    // Find the current breed level
    const breedLevel = await this.prismaService.breedLevel.findFirst({
      where: {
        pairId: breedPair.id,
        level: breedPair.currentLevel,
      },
    });

    if (!breedLevel) {
      throw new Error('Breed level not found');
    }

    if (breedLevel.bonusRate !== 0) {
      throw new Error('Breed rate already evaluated');
    }

    // Check the last breeding time
    if (!this.breedTimeElapsed(breedLevel.createdAt)) {
      throw new Error('Breeding time not elapsed');
    }

    let bonusRate = 0;

    const buds = await this.prismaService.breedBud.findMany({
      where: {
        id: {
          in: [maleBudId, femaleBudId],
        },
        levelId: breedLevel.id,
      },
    });

    // Verify bud genders in (M, F) pair
    if (!this.budService.checkBudPairGenders(buds, maleBudId, femaleBudId)) {
      throw new Error('Bud pair genders do not match');
    }

    // Get additional bonus rates
    for (const bud of buds) {
      bonusRate += this.hashTableService.lookUpBreedRate({
        thcId: bud.thc,
        budSize: bud.budSize,
      });
    }

    // Record bonus rate in the breed level
    await this.prismaService.breedLevel.update({
      where: {
        id: breedLevel.id,
      },
      data: {
        bonusRate,
        maleBreedBudId: maleBudId,
        femaleBreedBudId: femaleBudId,
      },
    });

    return bonusRate;
  }

  /**
   * Returns if required breed time has elapsed
   *
   * @param startDate breed start time
   * @returns boolean
   */
  breedTimeElapsed(startDate: Date) {
    const breedTime = this.configService.get<number>('breed.timePeriod');

    const elapsed = Date.now() - startDate.getTime();
    return elapsed >= breedTime * 1000;
  }

  async finalizeBreeding(pair: BreedPair) {
    const bonus = await this.prismaService.$queryRaw<[{sum: number}]>`
      SELECT sum("BreedLevel"."bonusRate")
      FROM "BreedLevel"
      WHERE "BreedLevel"."pairId" = ${pair.id}
        AND "BreedLevel"."level" >= 1
        AND "BreedLevel"."level" <= 5;
    `

    const finalRate = pair.rate + bonus[0].sum;

    return this.budService.diceGen1Bud(finalRate);
  }
}
