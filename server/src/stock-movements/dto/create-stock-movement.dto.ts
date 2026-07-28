import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional, Min } from 'class-validator';

export class CreateStockMovementDto {
  @IsNumber()
  @IsNotEmpty()
  productId!: number;

  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  type!: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}