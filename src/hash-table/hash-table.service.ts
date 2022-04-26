import { Injectable, Logger } from '@nestjs/common';
import hashTable from '../../data/hashTable.json';
import hashTableBegin from '../../data/hashTableBegin.json';
import { HashTableLookUpRequest } from './hash-table.types';

@Injectable()
export class HashTableService {
  private logger = new Logger('HashTableService');

  /**
   * For given (thcId, budSize) pair, returns the positive or negative rate that's receiving at each level of breeding
   * 
   * @param obj thcId, budSize
   * @returns rate
   */
  lookUpBreedRate(obj: HashTableLookUpRequest) {
    const { thcId, budSize } = obj;
    const rate = hashTable[thcId]?.[budSize];

    if (rate) {
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

  
}
