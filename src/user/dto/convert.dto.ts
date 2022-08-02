import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ConvertBPDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount!: number;
}
