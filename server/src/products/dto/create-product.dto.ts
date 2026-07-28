import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  current_stock?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  min_stock?: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId!: number;
}