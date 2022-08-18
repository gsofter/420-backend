import { IsNotEmpty, IsString } from "class-validator";

export class SearchBreederDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}
