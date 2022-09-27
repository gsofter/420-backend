import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class RenameGen1BudDto {
  @IsNumber()
  @IsNotEmpty()
  budId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  name!: string;
}

export class CheckNameValidityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  name!: string;
}
