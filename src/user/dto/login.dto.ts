import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsNumber()
  @IsNotEmpty()
  gameKeyId!: number;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}
