import { IsIn, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { AdminDtoBase } from './base.dto';

export class BreedingPointDto extends AdminDtoBase {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(1000)
  amount!: number;
}
