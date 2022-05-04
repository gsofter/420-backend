import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BudGender } from '@prisma/client';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import axios from 'axios';
import { multicall } from 'src/utils/multicall';
import { ADDRESSES } from 'src/config';
import * as BudAbi from 'src/abis/bud.json';
import { HashTableService } from 'src/hash-table/hash-table.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Network, Bud, BudWithId } from 'src/types';
import { generateRandomBud } from './../utils/bud';
import { winRandomChance } from './../utils/number';
import { DiceGen1BudResponse, VerifyBudPair, VerifyBudsOptions } from './bud.types';

@Injectable()
export class BudService {
  private logger = new Logger('BudService');
  private rpcProvider: JsonRpcProvider;

  constructor(
    private configService: ConfigService,
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
   * Verify if user owns buds referenced by maleBudId, and femaleBudId
   *
   * If such conditions are not met, the function throws an error
   * @param param0 CreateBudPair
   * @param checkMetadata If true, will check if buds are revealed and have correct metadatas
   * @returns
   */
   async verifyBudPairs(
    { address, maleBudId, femaleBudId }: VerifyBudPair,
    { checkMetadata = true }: VerifyBudsOptions = {},
  ) {
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
    } catch (e) {
      this.logger.error('multicall error check', e);
      throw new Error('Check BUDs ownershipf. RPC call error');
    }

    if (owner1 !== address || owner2 !== address) {
      throw new Error('Not the buds owner');
    }

    if (checkMetadata) {
      // Verify bud metadata
      const metadatas = await this.getMetadatas([
        maleBudId,
        femaleBudId,
      ]);

      for await (const metadata of metadatas) {
        if (!metadata.revealed) {
          throw new Error('Bud is not revealed');
        }
      }

      if (
        !this.checkBudPairGenders(metadatas, maleBudId, femaleBudId)
      ) {
        throw new Error('Bud pair genders do not match');
      }
    }
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
   * @returns Gen1Bud
   */
  async createGen1BudMintRequest(minter: string, bud: Bud, pairId: number | null = null) {
    const request = await this.prismaService.gen1MintRequest.findFirst({
      where: {
        requestedAt: null,
      },
    });

    if (!request) {
      throw new Error('Mint request is full');
    }

    // Create a Gen1 bud associated with the mint request
    const gen1Bud = await this.prismaService.gen1Bud.create({
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

    return gen1Bud;
  }
}
