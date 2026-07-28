import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  first_name!: string;

  @Column({ nullable: true })
  last_name!: string;

  @Column({ 
    type: 'varchar',
    default: 'USER' 
  })
  role!: 'SUPERUSER' | 'ADMIN' | 'USER';

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}