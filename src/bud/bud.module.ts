import { Module } from '@nestjs/common';
import { HashTableModule } from 'src/hash-table/hash-table.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BudService } from './bud.service';

@Module({
  imports: [HashTableModule, PrismaModule],
  providers: [BudService],
  exports: [BudService],
})
export class BudModule {}
