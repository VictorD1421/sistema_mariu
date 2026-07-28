import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  contact!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsDateString()
  @IsNotEmpty()
  last_receipt!: string;

  @IsDateString()
  @IsNotEmpty()
  next_receipt!: string;
}