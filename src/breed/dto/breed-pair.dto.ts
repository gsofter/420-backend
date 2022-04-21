import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBreedPairDto {
  @IsNumber()
  @IsNotEmpty()
  maleBudId!: number;

  @IsNumber()
  @IsNotEmpty()
  femaleBudId!: number;
}
