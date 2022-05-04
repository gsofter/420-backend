import { IsNumber, IsOptional } from 'class-validator';

export class Gen1BudQueryDto {
  @IsNumber()
  @IsOptional()
  budId?: number;
}
