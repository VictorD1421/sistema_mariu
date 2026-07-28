import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';

import { SalePayment } from './entities/sale-payment.entity'; // Importante
import { ProductsModule } from '../products/products.module';
import { SaleDetail } from './entities/sale-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleDetail, SalePayment]),
    ProductsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService]
})
export class SalesModule {}