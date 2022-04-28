import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateBreedPairDto {
  @IsNumber()
  @IsNotEmpty()
  maleBudId!: number;

  @IsNumber()
  @IsNotEmpty()
  femaleBudId!: number;
}

export class BreedPairQueryDto {
  @IsNumber()
  @IsOptional()
  pairId?: number;
}
