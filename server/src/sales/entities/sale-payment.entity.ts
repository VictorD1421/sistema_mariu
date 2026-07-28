import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Sale } from './sale.entity';

@Entity('sale_payments')
export class SalePayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'CASCADE' })
  sale!: Sale;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount_usd!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount_bs!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}