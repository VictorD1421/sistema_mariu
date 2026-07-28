import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateChatbotDto } from './dto/create-chatbot.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('create')
  create(@Body() createChatbotDto: CreateChatbotDto) {
    return this.chatbotService.create(createChatbotDto);
  }

  @Get('main')
  getInitial() {
    return this.chatbotService.getInitialOptions();
  }

  @Get('children/:id')
  getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.chatbotService.getStep(id); 
  }

  @Put('update/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.chatbotService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chatbotService.remove(id);
  }
}