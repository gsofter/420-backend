import { Module } from '@nestjs/common';
import { HashTableModule } from 'src/hash-table/hash-table.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GiftCardService } from './gift-card.service';
import { GiftCardController } from './gift-card.controller';

@Module({
  imports: [PrismaModule, HashTableModule],
  providers: [GiftCardService],
  exports: [GiftCardService],
  controllers: [GiftCardController],
})
export class GiftCardModule {}
