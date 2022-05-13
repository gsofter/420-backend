import { IsIn, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class BreedingPointDto {
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
  @Min(1)
  @Max(1000)
  amount!: number;
}
