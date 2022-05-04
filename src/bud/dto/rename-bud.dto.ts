import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class RenameGen1BudDto {
  @IsNumber()
  @IsNotEmpty()
  budId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  name!: string;
}
