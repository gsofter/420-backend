import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BudGender } from '@prisma/client';
import axios from 'axios';
import { BudWithId } from 'src/types';

@Injectable()
export class BudService {
  private logger = new Logger('BudService');

  constructor(private configService: ConfigService) {}

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
        tokenId: _id.toString(),
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
  checkBudPairGenders(buds: Array<{id: number, gender: BudGender}>, maleBudId: number, femaleBudId: number) {
    if (buds.length < 2) {
      return false;
    }

    for (const bud of buds) {
      if ((bud.id === maleBudId && bud.gender !== 'M') || (bud.id === femaleBudId && bud.gender !== 'F')) {
        return false;
      }
    }

    return true;
  }
}
