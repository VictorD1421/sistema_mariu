import { IsArray, IsNotEmpty, IsString, ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId!: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity!: number;
}

export class PaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount_usd?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount_bs?: number;
}

export class CreateSaleDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de factura es obligatorio' })
  invoice_number!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments!: PaymentDto[];
}