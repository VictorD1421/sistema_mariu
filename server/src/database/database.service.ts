import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async getTables(): Promise<string[]> {
    try {
      const dbName = this.configService.get<string>('DB_DATABASE');
      const results = await this.dataSource.query(
        `SELECT TABLE_NAME 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
        [dbName],
      );

      return results.map((row) => row.TABLE_NAME || row.table_name);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error al listar tablas', err.stack);
      throw new InternalServerErrorException('No se pudo obtener el esquema de la base de datos');
    }
  }

  async clearTables(tables: string[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

      for (const table of tables) {
        await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
      }

      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      await queryRunner.commitTransaction();
      this.logger.log(`Limpieza confirmada: ${tables.join(', ')}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Error en truncado de tablas', err.stack);
      throw new InternalServerErrorException('Error al vaciar las tablas seleccionadas');
    } finally {
      await queryRunner.release();
    }
  }

  async generateBackup(tables: string[]) {
    try {
      const backupData: any = {};

      for (const table of tables) {
        const data = await this.dataSource.query(`SELECT * FROM \`${table}\``);
        backupData[table] = data;
      }

      return {
        database: this.configService.get<string>('DB_DATABASE'),
        timestamp: new Date().toISOString(),
        tables: backupData,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error generando respaldo', err.stack);
      throw new InternalServerErrorException('Error al procesar los datos para el respaldo');
    }
  }

  async restoreBackup(backupData: any): Promise<void> {
    const currentDb = this.configService.get<string>('DB_DATABASE');
    
    if (backupData.database !== currentDb) {
      throw new InternalServerErrorException('El respaldo pertenece a otra base de datos');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

      const tables = Object.keys(backupData.tables);

      for (const tableName of tables) {
        const rows = backupData.tables[tableName];
        
        await queryRunner.query(`TRUNCATE TABLE \`${tableName}\``);
        
        if (rows && rows.length > 0) {
          const sanitizedRows = rows.map((row: any) => {
            const newRow = { ...row };
            for (const key in newRow) {
              if (typeof newRow[key] === 'string' && 
                  newRow[key].includes('T') && 
                  newRow[key].endsWith('Z')) {
                newRow[key] = newRow[key].replace('T', ' ').split('.')[0];
              }
            }
            return newRow;
          });

          await queryRunner.manager
            .createQueryBuilder(queryRunner)
            .insert()
            .into(tableName)
            .values(sanitizedRows)
            .execute();
        }
      }

      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      await queryRunner.commitTransaction();
      this.logger.log(`Restauración finalizada exitosamente: ${tables.join(', ')}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Error restaurando base de datos', err.stack);
      throw new InternalServerErrorException('Error al restaurar los datos del archivo');
    } finally {
      await queryRunner.release();
    }
  }
}