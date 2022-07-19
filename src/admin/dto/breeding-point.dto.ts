import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { AdminDtoBase } from './base.dto';

export class BreedingPointDto extends AdminDtoBase {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10000 * 100)
  amount!: number;
}
