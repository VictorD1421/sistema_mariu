import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity('chatbot_knowledge')
export class ChatbotKnowledge {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  trigger_text!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category!: string;

  @Column({ type: 'boolean', default: false })
  is_video!: boolean;

  @ManyToOne(() => ChatbotKnowledge, (kb) => kb.children, { onDelete: 'CASCADE' })
  parent!: ChatbotKnowledge | null;

  @OneToMany(() => ChatbotKnowledge, (kb) => kb.parent)
  children!: ChatbotKnowledge[];
}