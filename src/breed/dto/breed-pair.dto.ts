import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { GameItem } from 'src/types';

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

  @IsOptional()
  @IsBoolean()
  @ValidateIf(o => o.gameItemId === GameItem.FARMER_PASS)
  upgradeSlot?: boolean;
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
