import { IsIn, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class BuyLandDto {
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

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(20000)
  landId!: number;
}
