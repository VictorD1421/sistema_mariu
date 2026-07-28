import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const category = this.categoryRepo.create(createCategoryDto);
      return await this.categoryRepo.save(category);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('La categoría ya existe');
      }
      throw error;
    }
  }

  findAll() {
    return this.categoryRepo.find();
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({ 
      where: { id },
      relations: ['products']
    });
    if (!category) throw new NotFoundException(`Categoría #${id} no encontrada`);
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepo.preload({
      id: id,
      ...updateCategoryDto,
    });
    if (!category) throw new NotFoundException(`Categoría #${id} no existe`);
    
    try {
      return await this.categoryRepo.save(category);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    if (category.products && category.products.length > 0) {
      throw new ConflictException(
        'La categoría tiene productos asignados y no puede ser eliminada.'
      );
    }

    return await this.categoryRepo.remove(category);
  }
}