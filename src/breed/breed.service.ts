import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { CreateBudPair } from './breed.types';
import { generateRandomBud } from './../utils/bud';
import { multicall } from 'src/utils/multicall';
import { ADDRESSES } from 'src/config';
import BudAbi from 'src/abis/bud.json';
import { Network } from 'src/types';
import { BudService } from 'src/bud/bud.service';
import { HashTableService } from 'src/hash-table/hash-table.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BreedPair } from '@prisma/client';

@Injectable()
export class BreedService {
  private rpcProvider: JsonRpcProvider;

  constructor(
    private configService: ConfigService,
    private budService: BudService,
    private hashTableService: HashTableService,
    private prismaService: PrismaService,
  ) {
    const rpcUrl = configService.get<string>('network.rpc');
    const chainId = configService.get<number>('network.chainId');

    this.rpcProvider = new ethers.providers.StaticJsonRpcProvider(
      rpcUrl,
      chainId,
    );
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
        budSize: metadata.size,
      });
    }

    // TODO: Add bouns rate if user owns eligible in-game items

    return baseSuccessRate + bonusRate;
  }

  /**
   * Verify if user owns buds referenced by maleBudId, and femaleBudId
   *
   * If such conditions are not met, the function throws an error
   * @param param0 CreateBudPair
   * @returns true
   */
  async verifyBudPairs({ address, maleBudId, femaleBudId }: CreateBudPair) {
    const network = this.configService.get<Network>('network.name');

    if (isNaN(maleBudId) || maleBudId < 0 || maleBudId >= 20000) {
      throw new Error('Invalid budId for male');
    }

    if (isNaN(femaleBudId) || femaleBudId < 0 || femaleBudId >= 20000) {
      throw new Error('Invalid budId for female');
    }

    let [owner1, owner2] = ['', ''];
    try {
      [owner1, owner2] = await multicall(
        this.rpcProvider,
        ADDRESSES[network].MULTICALL,
        BudAbi,
        [
          {
            contractAddress: ADDRESSES[network].BUD,
            functionName: 'ownerOf',
            params: [maleBudId],
          },
          {
            contractAddress: ADDRESSES[network].BUD,
            functionName: 'ownerOf',
            params: [femaleBudId],
          },
        ],
      );
    } catch {
      throw new Error('Check BUDs ownershipf. RPC call error');
    }

    if (owner1 !== address || owner2 !== address) {
      throw new Error('Not the buds owner');
    }

    return true;
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
    const buds = [
      generateRandomBud({ targetGender: 'M' }),
      generateRandomBud({ targetGender: 'F' }),
      generateRandomBud({ targetGender: 'F' }),
      generateRandomBud({ targetGender: 'M' }),
    ];

    // Max level reached
    if (breedPair.currentLevel >= 5) {
      throw new Error('Max breed level reached');
    }

    try {
      const newLevel = breedPair.currentLevel + 1;
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

      // Update breed pair
      await this.prismaService.breedPair.update({
        where: {
          id: breedPair.id,
        },
        data: {
          currentLevel: newLevel,
        },
      });

      return breedLevel;
    } catch (e) {
      throw new Error('Error creating new level: ' + e.message);
    }
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

    // Get additional bonus rates
    try {
      const buds = await this.prismaService.breedBud.findMany({
        where: {
          id: {
            in: [maleBudId, femaleBudId],
          },
        }
      });

      for (const bud of buds) {
        bonusRate += this.hashTableService.lookUpBreedRate({
          thcId: bud.thc,
          budSize: bud.size,
        });
      }

      // Record bonus rate in the breed level
      await this.prismaService.breedLevel.update({
        where: {
          id: breedLevel.id,
        },
        data: {
          bonusRate,
        },
      });

      return bonusRate;
    } catch (e) {
      throw new Error(`Error getting buds (bonusRate: ${bonusRate}): ${e.message}`);
    }
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
    return elapsed >= breedTime;
  }
}
