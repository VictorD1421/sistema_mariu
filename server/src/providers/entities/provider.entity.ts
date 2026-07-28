import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  contact!: string;

  @Column()
  category!: string;

  @Column({ type: 'date' })
  last_receipt!: string;

  @Column({ type: 'date' })
  next_receipt!: string;

  @CreateDateColumn()
  created_at!: Date;
}