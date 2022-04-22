import { Module } from '@nestjs/common';
import { HashTableService } from './hash-table.service';

@Module({
  providers: [HashTableService],
  exports: [HashTableService],
})
export class HashTableModule {}
