import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    private productService: ProductsService,
    private dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalCalculado = 0;
      const detalles: SaleDetail[] = [];

      for (const item of createSaleDto.items) {
        const product = await this.productService.findOne(item.productId);
        
        if (product.current_stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para: ${product.name}`);
        }

        const subtotal = Number(product.price) * item.quantity;
        totalCalculado += subtotal;

        const detail = new SaleDetail();
        detail.product = product;
        detail.quantity = item.quantity;
        detail.unit_price = product.price;
        detail.subtotal = subtotal;
        detalles.push(detail);

        product.current_stock -= item.quantity;
        await queryRunner.manager.save(product);
      }

      const totalPagadoEnUSD = createSaleDto.payments.reduce((acc, p) => acc + Number(p.amount_usd || 0), 0);
      
      const precisionTotal = Math.round(totalCalculado * 100) / 100;
      const precisionPagado = Math.round(totalPagadoEnUSD * 100) / 100;

      if (Math.abs(precisionPagado - precisionTotal) > 0.01) {
        throw new BadRequestException('El monto total en USD no coincide con el total de la venta');
      }

      const sale = new Sale();
      sale.invoice_number = createSaleDto.invoice_number;
      sale.total_amount = precisionTotal;
      sale.user = { id: userId } as any;
      sale.details = detalles;

      sale.payments = createSaleDto.payments.map(p => {
        const payment = new SalePayment();
        payment.amount_usd = Number(p.amount_usd || 0);
        payment.amount_bs = Number(p.amount_bs || 0);
        return payment;
      });

      const savedSale = await queryRunner.manager.save(sale);
      
      await queryRunner.commitTransaction();
      return savedSale;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(date?: string) {
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      return await this.saleRepo.find({
        where: {
          created_at: Between(start, end)
        },
        relations: ['details', 'details.product', 'payments', 'user'],
        order: { created_at: 'ASC' }
      });
    }

    return await this.saleRepo.find({
      relations: ['details', 'details.product', 'payments', 'user'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: number) {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['details', 'details.product', 'payments', 'user']
    });
    if (!sale) throw new NotFoundException(`Venta #${id} no encontrada`);
    return sale;
  }

  async getStats() {
    return await this.saleRepo
      .createQueryBuilder('sale')
      .select("DATE(sale.created_at)", 'date')
      .addSelect('SUM(sale.total_amount)', 'total')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async getWeeklyReportData() {
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sales = await this.saleRepo
      .createQueryBuilder('sale')
      .leftJoin('sale.details', 'details')
      .select("DATE(sale.created_at)", 'fecha')
      .addSelect('SUM(sale.total_amount)', 'monto')
      .addSelect('SUM(details.quantity)', 'cantidad')
      .where('sale.created_at >= :monday', { monday })
      .groupBy('fecha')
      .orderBy('fecha', 'ASC')
      .getRawMany();

    const topProduct = await this.dataSource
      .getRepository(SaleDetail)
      .createQueryBuilder('detail')
      .leftJoin('detail.product', 'product')
      .leftJoin('detail.sale', 'sale')
      .select('product.name', 'name')
      .addSelect('SUM(detail.quantity)', 'count')
      .where('sale.created_at >= :monday', { monday })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      sales: sales.map(s => ({
        fecha: s.fecha,
        monto: parseFloat(s.monto),
        cantidad: parseInt(s.cantidad),
      })),
      topProduct: topProduct ? {
        name: topProduct.name,
        count: parseInt(topProduct.count)
      } : null
    };
  }
}