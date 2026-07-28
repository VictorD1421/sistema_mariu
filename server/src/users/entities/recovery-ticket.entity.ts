import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recovery_tickets')
export class RecoveryTicket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  full_name!: string;

  @Column()
  position!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  ticket_code!: string;

  @Column({ nullable: true })
  device_info!: string;

  @Column({ default: 'PENDING' })
  status!: 'PENDING' | 'RESOLVED';

  @CreateDateColumn()
  created_at!: Date;
}