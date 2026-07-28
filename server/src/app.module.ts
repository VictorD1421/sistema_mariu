import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { AuthModule } from './auth/auth.module'; 
import { LogsModule } from './logs/logs.module';
import { SalesModule } from './sales/sales.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { ReportsModule } from './reports/reports.module';
import { ProvidersModule } from './providers/providers.module';
import { DatabaseModule } from './database/database.module';
import { ChatbotModule } from './chatbot/chatbot.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true, 
        synchronize: true, 
      }),
    }),

    CategoriesModule,
    ProductsModule,
    UsersModule,
    StockMovementsModule,
    AuthModule,
    LogsModule,
    SalesModule,
    ExchangeRatesModule,
    ReportsModule,
    ProvidersModule,
    DatabaseModule,
    ChatbotModule,
  ],
  providers: [],
})
export class AppModule {}