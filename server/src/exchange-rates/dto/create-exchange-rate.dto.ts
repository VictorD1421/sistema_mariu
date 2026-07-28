import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateExchangeRateDto {
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsNumber()
  @IsNotEmpty()
  value!: number;
}