import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateBreedPairDto {
  @IsNumber()
  @IsNotEmpty()
  maleBudId!: number;

  @IsNumber()
  @IsNotEmpty()
  femaleBudId!: number;

  @IsNumber()
  @IsNotEmpty()
  slotId!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  gameItemId?: number;
}


export class InvalidBreedPairDto {
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

  @IsBoolean()
  @IsOptional()
  includePastBreeding?: boolean;
}
