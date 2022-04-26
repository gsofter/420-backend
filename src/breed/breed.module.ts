import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { BudModule } from './../bud/bud.module';
import { HashTableModule } from './../hash-table/hash-table.module';
import { PrismaModule } from './../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BudModule, HashTableModule],
  providers: [BreedService],
  controllers: [BreedController],
})
export class BreedModule {}
