import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class OpenSlotDto {
  @IsNumber()
  @IsNotEmpty()
  slotId!: number;
}

export class PurchaseGameItemDto {
  @IsNumber()
  @IsNotEmpty()
  @Max(3)
  @Min(1)
  amount!: number;
}
