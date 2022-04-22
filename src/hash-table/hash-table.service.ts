import { Injectable, Logger } from '@nestjs/common';
import hashTable from '../../data/hashTable.json';

@Injectable()
export class HashTableService {
  private logger = new Logger('HashTableService');

  /**
   * Return the success rate for a given thcId and budSize
   * 
   * @param obj thcId, budSize
   * @returns Number
   */
  lookUpHashTable(obj: { thcId: number; budSize: number }) {
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
}
