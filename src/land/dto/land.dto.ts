import { IsNotEmpty, IsNumber } from 'class-validator';

export class OpenSlotDto {
  @IsNumber()
  @IsNotEmpty()
  slotId!: number;
}
