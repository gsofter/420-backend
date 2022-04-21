import { Module } from '@nestjs/common';
import { HashTableService } from './hash-table.service';

@Module({
  providers: [HashTableService],
})
export class HashTableModule {}
