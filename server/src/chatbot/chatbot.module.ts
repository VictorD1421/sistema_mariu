import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotKnowledge } from './entities/chatbot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotKnowledge])],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}