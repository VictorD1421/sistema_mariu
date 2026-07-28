import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RecoveryTicket } from './entities/recovery-ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RecoveryTicket]) 
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}