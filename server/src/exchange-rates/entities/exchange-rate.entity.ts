import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 10 })
  currency!: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  value!: number;

  @CreateDateColumn()
  createdAt!: Date;
}