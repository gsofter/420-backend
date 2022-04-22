import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { CreateBudPair } from './breed.types';
import { multicall } from 'src/utils/multicall';
import { ADDRESSES } from 'src/config';
import BudAbi from 'src/abis/bud.json';
import { Network } from 'src/types';

@Injectable()
export class BreedService {
  private rpcProvider: JsonRpcProvider;

  constructor(private configService: ConfigService) {
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
  getStartSuccessRate(address: string): number {
    return 20;
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
}
