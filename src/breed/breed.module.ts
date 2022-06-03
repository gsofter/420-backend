import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { BudModule } from './../bud/bud.module';
import { HashTableModule } from './../hash-table/hash-table.module';
import { PrismaModule } from './../prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { LandModule } from 'src/land/land.module';
import { GiftCardModule } from 'src/gift-card/gift-card.module';

@Module({
  imports: [PrismaModule, BudModule, HashTableModule, UserModule, LandModule, GiftCardModule],
  providers: [BreedService],
  exports: [BreedService],
  controllers: [BreedController],
})
export class BreedModule {}
