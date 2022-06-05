import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class InvalidateBreedingDto {
  @IsString()
  @IsNotEmpty()
  prevOwner!: string;

  @IsString()
  @IsNotEmpty()
  owner!: string;

  @IsNumber()
  @IsNotEmpty()
  budId!: number;
}
