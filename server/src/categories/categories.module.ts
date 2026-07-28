import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { LogsModule } from '../logs/logs.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    LogsModule 
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, TypeOrmModule]
})
export class CategoriesModule {}