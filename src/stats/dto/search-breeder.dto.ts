import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchBreederDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(42)
  address: string;
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
