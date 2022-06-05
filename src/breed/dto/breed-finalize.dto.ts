import { IsNotEmpty, IsNumber } from 'class-validator';

export class BreedFinalizeDto {
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
