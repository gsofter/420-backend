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

@Injectable()
export class BreedService {
  private rpcProvider: JsonRpcProvider;

  constructor(private configService: ConfigService, private budService: BudService, private hashTableService: HashTableService) {
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
  async getStartSuccessRate({ address, maleBudId, femaleBudId }: CreateBudPair) {
    const baseSuccessRate = this.configService.get<number>('breed.baseSuccessRate');

    // Get bud metadatas
    const metadatas = await this.budService.getMetadatas([maleBudId, femaleBudId]);

    let bonusRate = 0;
    for (const metadata of metadatas) {
      bonusRate += this.hashTableService.lookUpBeginningSuccessRate({
        thcId: metadata.thc,
        budSize: metadata.size
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

  startBreedLevel() {
    const buds = [
      generateRandomBud({ targetGender: 'M'}),
      generateRandomBud({ targetGender: 'F'}),
      generateRandomBud({ targetGender: 'F'}),
      generateRandomBud({ targetGender: 'M'}),
    ]

    return buds;
  }
}
