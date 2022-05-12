import { Injectable, Logger } from '@nestjs/common';
import { randomNumber } from 'src/utils/number';
import * as hashTable from '../../data/hashTable.json';
import * as hashTableBegin from '../../data/hashTableBegin.json';
import * as hashTableGen1 from '../../data/hashTableGen1.json';
import * as hashTableReward from '../../data/hashTableReward.json';
import { HashTableLookUpRequest } from './hash-table.types';

@Injectable()
export class HashTableService {
  private logger = new Logger('HashTableService');
  private gen1Rates: number[];
  private rewardRates: number[];

  constructor() {
    this.gen1Rates = Object.keys(hashTableGen1).map((x) => Number(x));
    this.gen1Rates.sort((a, b) => a - b);

    this.rewardRates = Object.keys(hashTableReward).map((x) => Number(x));
    this.rewardRates.sort((a, b) => a - b);
  }

  /**
   * For given (thcId, budSize) pair, returns the positive or negative rate that's receiving at each level of breeding
   *
   * @param obj thcId, budSize
   * @returns rate
   */
  lookUpBreedRate(obj: HashTableLookUpRequest) {
    const { thcId, budSize } = obj;
    const rate = hashTable[thcId]?.[budSize];

    if (rate === 0 || !!rate) {
      return Number(rate);
    }

    this.logger.warn(
      'lookUpHashTable: thcId or budSize not found: ' + JSON.stringify(obj),
    );
    return 0;
  }

  /**
   * For given (thcId, budSize) pair, returns the beginning success rate if found in the table. If not, return s0
   *
   * @param param0 HashTableLookUpRequest
   * @returns rate
   */
  lookUpBeginningSuccessRate({ thcId, budSize }: HashTableLookUpRequest) {
    return hashTableBegin[thcId]?.[budSize] || 0;
  }

  /**
   * Get the random {thc, budSize} within the target rate range
   * @param rate number
   * @returns
   */
  lookUpGen1Bud(rate: number): { thc: number; budSize: number } {
    const matchedRate = this.getMatchingGen1Rate(rate);
    const randomGroup =
      hashTableGen1[matchedRate][
        randomNumber(hashTableGen1[matchedRate].length - 1)
      ];

    return {
      thc: Number(randomGroup.thc),
      budSize: Number(randomGroup.size),
    };
  }

  private getMatchingGen1Rate(rate: number) {
    for (const gen1Rate of this.gen1Rates) {
      if (rate <= gen1Rate) {
        return gen1Rate;
      }
    }

    // above than 50
    // TODO: Missing group from [51, 100]
    return this.gen1Rates[this.gen1Rates.length - 1];
  }

  lookUpRewardTable(rate: number): {
    tokenId: number;
    amount: number;
    price: string;
  } | null {

    let baseRate = -1;
    for (const r of this.rewardRates) {
      if (rate <= r) {
        baseRate = r;
        break;
      }
    }


    if (baseRate > 0) {
      return hashTableReward[baseRate];
    }

    return null;
  }
}
