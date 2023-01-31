import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class InvalidateSlotsDto {
  @IsString()
  @IsNotEmpty()
  prevOwner!: string;

  @IsString()
  @IsNotEmpty()
  owner!: string;

  @IsNumber()
  @IsNotEmpty()
  gameKeyId!: number;

  @IsNumber()
  option?: number;
}
