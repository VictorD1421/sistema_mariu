import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ChatbotKnowledge } from './entities/chatbot.entity';
import { CreateChatbotDto } from './dto/create-chatbot.dto';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatbotKnowledge)
    private readonly kbRepo: Repository<ChatbotKnowledge>,
  ) {}

  async create(createChatbotDto: CreateChatbotDto) {
    const { parentId, ...data } = createChatbotDto;
    
    const entry = this.kbRepo.create({
      ...data,
      parent: parentId ? { id: parentId } : null,
    });
    
    return await this.kbRepo.save(entry);
  }

  async update(id: number, updateData: Partial<ChatbotKnowledge>) {
    const item = await this.kbRepo.preload({
      id,
      ...updateData,
    });
    if (!item) throw new NotFoundException('Registro no encontrado');
    return await this.kbRepo.save(item);
  }

  async getInitialOptions() {
    return await this.kbRepo.find({
      where: { parent: IsNull() },
      order: { id: 'ASC' }
    });
  }

  async getStep(id: number) {
    const step = await this.kbRepo.findOne({
      where: { id },
      relations: ['children'],
      order: {
        children: {
          id: 'ASC'
        }
      }
    });

    if (!step) throw new NotFoundException('Paso del asistente no encontrado');
    return step;
  }

  async remove(id: number) {
    const result = await this.kbRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Registro no encontrado');
    return { message: 'Eliminado exitosamente' };
  }

  async seedKnowledge(data: CreateChatbotDto[]) {
    return await this.kbRepo.save(data);
  }

  async clearKnowledge() {
    return await this.kbRepo.delete({});
  }
}