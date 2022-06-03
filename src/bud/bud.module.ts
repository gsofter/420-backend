import { Module } from '@nestjs/common';
import { HashTableModule } from 'src/hash-table/hash-table.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BudService } from './bud.service';
import { BudController } from './bud.controller';

@Module({
  imports: [HashTableModule, PrismaModule],
  providers: [BudService],
  exports: [BudService],
  controllers: [BudController],
})
export class BudModule {}
