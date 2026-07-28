import { Controller, Post, Body, Get, Param, Delete, Patch, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RecoveryRequestDto } from './dto/recovery-request.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('check-status/:username')
  async checkStatus(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return { isActive: user ? user.isActive : true };
  }

  @Post('recovery-request')
  async requestRecovery(@Body() recoveryDto: RecoveryRequestDto) {
    return this.usersService.createRecoveryTicket(recoveryDto);
  }

  @Get('recovery-tickets')
  async getAllTickets() {
    return this.usersService.findAllTickets();
  }

  @Patch(':id/status')
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleStatus(id);
  }

  @Patch('recovery-tickets/:id/status')
  async updateTicketStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'PENDING' | 'RESOLVED'
  ) {
    return this.usersService.updateTicketStatus(id, status);
  }

  @Delete('recovery-tickets/:id')
  async removeTicket(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.removeTicket(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}