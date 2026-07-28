import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private dataSource: DataSource,
    private readonly logsService: LogsService,
  ) {}

  async create(
    productId: number, 
    userId: number, 
    type: 'IN' | 'OUT' | 'ADJUSTMENT', 
    quantity: number, 
    reason?: string
  ) {
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Producto no encontrado');

    let newStock = Number(product.current_stock);

    if (type === 'IN') {
      newStock += quantity;
    } else if (type === 'OUT') {
      if (newStock < quantity) {
        throw new BadRequestException(`Stock insuficiente. Disponible: ${newStock}`);
      }
      newStock -= quantity;
    } else if (type === 'ADJUSTMENT') {
      newStock += quantity;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      product.current_stock = newStock;
      await queryRunner.manager.save(product);

      const movement = this.movementRepo.create({
        product,
        user: { id: userId } as any,
        type,
        quantity,
        reason: reason || 'Sin motivo especificado',
      });
      const savedMovement = await queryRunner.manager.save(movement);

      await this.logsService.createLog(
        `${userId}`, 
        'STOCK_MOVEMENT',
        `Movimiento ${type}: ${quantity} unidades de "${product.name}" (SKU: ${product.sku}). Stock resultante: ${newStock}`
      );

      await queryRunner.commitTransaction();

      const lowStockAlert = product.current_stock <= product.min_stock;

      return {
        message: 'Movimiento procesado y auditado con éxito',
        alert: lowStockAlert ? `⚠️ Stock bajo el mínimo para ${product.name}` : null,
        data: savedMovement,
        newStock: product.current_stock
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error en la operación: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.movementRepo.find({
      relations: ['product', 'user'],
      order: { id: 'DESC' }, 
    });
  }
}