import { Module } from '@nestjs/common';
import { HashTableModule } from 'src/hash-table/hash-table.module';
import { BudService } from './bud.service';

@Module({
  imports: [HashTableModule],
  providers: [BudService],
  exports: [BudService],
})
export class BudModule {}
