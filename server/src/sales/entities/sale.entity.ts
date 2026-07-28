import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SaleDetail } from './sale-detail.entity';
import { SalePayment } from './sale-payment.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  invoice_number!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_amount!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => User, (user) => user.id)
  user!: User;

  @OneToMany(() => SaleDetail, (detail) => detail.sale, { cascade: true })
  details!: SaleDetail[];

  @OneToMany(() => SalePayment, (payment) => payment.sale, { cascade: true })
  payments!: SalePayment[];
}