import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdminDtoBase {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  txHash!: string;

  @IsNumber()
  @IsNotEmpty()
  block!: number;

  @IsString()
  @IsIn(['rinkeby', 'mainnet'])
  network!: string;
}
