import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: ['IN', 'OUT', 'ADJUSTMENT'] })
  type!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ nullable: true })
  reason!: string;

  @CreateDateColumn()
  movement_date!: Date;

  @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
  product!: Product;

  @ManyToOne(() => User, (user) => user.id)
  user!: User;
}