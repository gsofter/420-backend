import { IsIn, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { AdminDtoBase } from './base.dto';

export class BuyLandDto extends AdminDtoBase {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(20000)
  landId!: number;
}
