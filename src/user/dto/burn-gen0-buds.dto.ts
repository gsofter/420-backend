import { IsIn, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class BurnGen0Buds {
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
  maleBudId!: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(20000)
  femaleBudId!: number;
}
