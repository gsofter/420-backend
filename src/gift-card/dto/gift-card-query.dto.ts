import { GiftAmount } from '@prisma/client';
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { GiftAmounts } from 'src/utils/gift-card';

export class GiftCardQueryDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  @IsOptional()
  @IsIn(GiftAmounts)
  value?: GiftAmount
}
