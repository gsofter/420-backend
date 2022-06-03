import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { AdminDtoBase } from './base.dto';

export class BurnGen0Buds extends AdminDtoBase {
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
