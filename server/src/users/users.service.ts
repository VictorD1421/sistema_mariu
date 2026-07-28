import { Injectable, OnModuleInit, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RecoveryTicket } from './entities/recovery-ticket.entity';
import { RecoveryRequestDto } from './dto/recovery-request.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RecoveryTicket)
    private ticketsRepository: Repository<RecoveryTicket>,
  ) {}

  async onModuleInit() {
    const superUser = await this.usersRepository.findOne({ where: { username: 'super_Victor' } });
    
    if (!superUser) {
      const envPassword = process.env.SUPER_USER_PASSWORD;
      if (!envPassword) {
        this.logger.error('FATAL: SUPER_USER_PASSWORD no está definida');
        return;
      }

      const cleanPassword = envPassword.replace(/['"\s]/g, '');
      const hashedPassword = await bcrypt.hash(cleanPassword, 10);
      
      try {
        await this.usersRepository.save(this.usersRepository.create({
          username: 'super_Victor',
          password: hashedPassword,
          first_name: 'Admin',
          last_name: 'Principal',
          role: 'SUPERUSER',
          isActive: true,
        }));
        this.logger.log('Superusuario creado con éxito');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        this.logger.error(`Error al crear el superusuario: ${message}`);
      }
    }
  }

  async createRecoveryTicket(data: RecoveryRequestDto) {
    const newTicket = this.ticketsRepository.create({
      username: data.username,
      full_name: data.fullName,
      position: data.position,
      description: data.description,
      ticket_code: data.ticketCode,
      device_info: data.device
    });

    await this.ticketsRepository.save(newTicket);
    this.logger.log(`Ticket de soporte generado para: ${data.username} (Code: ${data.ticketCode})`);
    return { success: true, message: 'Ticket registrado en el sistema' };
  }

  async findAllTickets() {
    return await this.ticketsRepository.find({
      order: { created_at: 'DESC' }
    });
  }

  async updateTicketStatus(id: number, status: 'PENDING' | 'RESOLVED') {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket de recuperación no encontrado');
    
    ticket.status = status;
    return await this.ticketsRepository.save(ticket);
  }

  async removeTicket(id: number) {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    
    await this.ticketsRepository.remove(ticket);
    return { success: true };
  }

  async findAll() {
    return await this.usersRepository.find({
      select: ['id', 'username', 'first_name', 'last_name', 'role', 'isActive'],
      order: { id: 'DESC' }
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(data: any) {
    const exists = await this.findByUsername(data.username);
    if (exists) throw new BadRequestException('El nombre de usuario ya está en uso');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = this.usersRepository.create({ ...data, password: hashedPassword });
    const savedUser = await this.usersRepository.save(newUser);
    const { password, ...result } = savedUser as any;
    return result;
  }

  async update(id: number, data: any) {
    const user = await this.findOne(id);
    if (data.password && data.password.trim() !== "") {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }
    await this.usersRepository.update(id, data);
    const updatedUser = await this.findOne(id);
    const { password, ...result } = updatedUser as any;
    return result;
  }

  async toggleStatus(id: number) {
    const user = await this.findOne(id);
    if (user.username === 'super_Victor') {
      throw new BadRequestException('No se puede inhabilitar al superusuario');
    }
    user.isActive = !user.isActive;
    await this.usersRepository.save(user);
    return { 
      success: true, 
      isActive: user.isActive,
      message: `Usuario ${user.isActive ? 'activado' : 'inhabilitado'} correctamente` 
    };
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (user.username === 'super_Victor') {
      throw new BadRequestException('No se puede eliminar al superusuario');
    }
    await this.usersRepository.remove(user);
    return { success: true };
  }
}