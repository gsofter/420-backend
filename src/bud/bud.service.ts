import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BudGender } from '@prisma/client';
import axios from 'axios';
import { HashTableService } from 'src/hash-table/hash-table.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Bud, BudWithId } from 'src/types';
import { generateRandomBud } from './../utils/bud';
import { winRandomChance } from './../utils/number';
import { DiceGen1BudResponse } from './bud.types';

@Injectable()
export class BudService {
  private logger = new Logger('BudService');

  constructor(
    private configService: ConfigService,
    private hashTableService: HashTableService,
    private prismaService: PrismaService,
  ) {}

  /**
   * Get metadatas of given bud ids
   *
   * @param tokenIds an array of bud token id
   * @returns Promise<BudWithId[]>
   */
  async getMetadatas(tokenIds: (string | number)[]): Promise<BudWithId[]> {
    const apiUrl = this.configService.get<string>('metadataApi.url');
    const apiKey = this.configService.get<string>('metadataApi.key');
    const network = this.configService.get<string>('network.name');

    // https://420.looklabs.xyz/budapi/buds/buds?tokenId%5B%5D=32&tokenId%5B%5D=33&tokenId%5B%5D=42&tokenId%5B%5D=102

    try {
      const chunkSize = 100;
      const chunks: string[] = [];
      for (let i = 0; i < tokenIds.length; i += chunkSize) {
        const chunk = tokenIds.slice(i, i + chunkSize);
        chunks.push(chunk.map((id) => `tokenId[]=${id}`).join('&'));
      }

      const metadataChunks = await Promise.all(
        chunks.map((param) =>
          axios
            .get(
              `${apiUrl}/${
                network === 'rinkeby' ? 'dev/' : ''
              }budapi/buds/buds?${param}`,
              {
                headers: {
                  'X-Api-key': apiKey,
                },
              },
            )
            .then((response) => response.data),
        ),
      );

      const metadatas = [];
      for (const chunk of metadataChunks) {
        metadatas.push(...chunk);
      }

      return metadatas.map(({ _id, __v, ...r }) => ({
        ...r,
        id: Number(_id),
      }));
    } catch (e) {
      this.logger.error('getBudsMetadata: ' + e.message);
    }

    return [];
  }

  /**
   * Check if bud pair genders come in (M, F) pair
   *
   * @param buds an array of buds with at least bud id and gender info
   * @param maleBudId id of male bud
   * @param femaleBudId id of female bud
   * @returns boolean
   */
  checkBudPairGenders(
    buds: Array<{ id: number; gender: BudGender }>,
    maleBudId: number,
    femaleBudId: number,
  ) {
    if (buds.length < 2) {
      return false;
    }

    for (const bud of buds) {
      if (
        (bud.id === maleBudId && bud.gender !== 'M') ||
        (bud.id === femaleBudId && bud.gender !== 'F')
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Roll a dice and if wins under the chance, return gen1 bud with traits in hash table
   *
   * @param rate number
   * @returns DiceGen1BudResponse
   */
  diceGen1Bud(rate: number): DiceGen1BudResponse {
    const success = winRandomChance(rate);

    if (!success) {
      return {
        success: false,
        data: null,
      };
    }

    const bud = generateRandomBud();
    const thcAndBudSize = this.hashTableService.lookUpGen1Bud(rate);

    return {
      success: true,
      data: {
        ...bud,
        ...thcAndBudSize,
      },
    };
  }

  /**
   * Create a Gen1 bud with requested metadata and assign a request id to it.
   * If this is called after breeding, pairId should not be null.
   * Returns an assigned requestId if successful.
   * 
   * @param minter string
   * @param bud Bud
   * @param pairId number | null
   * @returns requestId
   */
  async getMintRequestId(minter: string, bud: Bud, pairId: number | null = null) {
    const request = await this.prismaService.gen1MintRequest.findFirst({
      where: {
        requestedAt: null,
      },
    });

    if (!request) {
      throw new Error('Mint request is full');
    }

    // Create a Gen1 bud associated with the mint request
    await this.prismaService.gen1Bud.create({
      data: {
        ...bud,
        requestId: request.id,
        pairId,
        minterAddress: minter,
      },
    });

    // Update the mint request `usedAt` field
    await this.prismaService.gen1MintRequest.update({
      where: {
        id: request.id,
      },
      data: {
        requestedAt: new Date(),
      },
    });

    return request.id;
  }
}
