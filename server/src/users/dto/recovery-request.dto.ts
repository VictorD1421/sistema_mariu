import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecoveryRequestDto {
  @IsString()
  @IsOptional()
  username!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  position!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  ticketCode!: string;

  @IsString()
  device!: string;
}