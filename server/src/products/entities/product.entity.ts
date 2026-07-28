import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  sku!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: 0 })
  current_stock!: number;

  @Column({ default: 5 })
  min_stock!: number;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    eager: true,
  })
  category!: Category;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}