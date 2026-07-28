import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('db')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('tables')
  @Roles('SUPERUSER')
  async getTables() {
    return await this.databaseService.getTables();
  }

  @Post('clear')
  @Roles('SUPERUSER')
  async clearTables(@Body('tables') tables: string[]) {
    await this.databaseService.clearTables(tables);
    return { 
      message: 'Tablas vaciadas correctamente',
      tablasAfectadas: tables 
    };
  }

  @Post('backup')
  @Roles('SUPERUSER')
  async backup(@Body() body: { tables: string[], type: string }) {
    const backup = await this.databaseService.generateBackup(body.tables);
    return { 
      message: 'Respaldo generado con éxito',
      data: backup
    };
  }

  @Post('restore')
  @Roles('SUPERUSER')
  async restore(@Body() backupData: any) {
    await this.databaseService.restoreBackup(backupData);
    return { 
      message: 'Base de datos restaurada exitosamente' 
    };
  }
}