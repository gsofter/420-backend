import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, MaxLength } from 'class-validator';

export class SearchBreederDto {
  @IsString()
  @IsNotEmpty()
  @Length(42)
  address: string;
}

export class QueryStatsDto {
  @IsNumber()
  @Type(() => Number)
  @Max(100)
  @IsOptional()
  limit?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  cursor?: number;
}

export class CheckShopRequirementsDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({
    each: true,
  })
  @MaxLength(42, { each: true })
  @Transform(v => Array.from(new Set(v.value)))
  addresses: string[];
}
