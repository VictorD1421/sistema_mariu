import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'json', nullable: true })
  data!: any;

  @CreateDateColumn()
  created_at!: Date;
}