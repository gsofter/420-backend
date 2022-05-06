import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { BudModule } from './../bud/bud.module';
import { HashTableModule } from './../hash-table/hash-table.module';
import { PrismaModule } from './../prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { LandModule } from 'src/land/land.module';

@Module({
  imports: [PrismaModule, BudModule, HashTableModule, UserModule, LandModule],
  providers: [BreedService],
  controllers: [BreedController],
})
export class BreedModule {}
