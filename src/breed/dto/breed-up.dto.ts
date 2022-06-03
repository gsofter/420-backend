import { IsNotEmpty, IsNumber } from 'class-validator';

export class BreedUpDto {
  @IsNumber()
  @IsNotEmpty()
  pairId!: number;

  @IsNumber()
  @IsNotEmpty()
  maleBudId!: number;

  @IsNumber()
  @IsNotEmpty()
  femaleBudId!: number;
}
