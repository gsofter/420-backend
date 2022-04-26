import { Module } from '@nestjs/common';
import { BudService } from './bud.service';

@Module({
  providers: [BudService],
  exports: [BudService],
})
export class BudModule {}
