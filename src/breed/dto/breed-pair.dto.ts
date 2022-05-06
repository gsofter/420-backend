import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  gameKeyId?: number;
}

export class BreedPairQueryDto {
  @IsNumber()
  @IsOptional()
  pairId?: number;

  @IsBoolean()
  @IsOptional()
  includePastBreeding?: boolean;
}
