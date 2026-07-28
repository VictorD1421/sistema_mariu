import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepo.create({
      ...createProductDto,
      category: { id: createProductDto.categoryId } as any,
    });
    return await this.productRepo.save(product);
  }

  findAll() {
    return this.productRepo.find();
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    
    if (updateProductDto.categoryId) {
      product.category = { id: updateProductDto.categoryId } as any;
    }

    Object.assign(product, updateProductDto);
    return await this.productRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    return await this.productRepo.remove(product);
  }

  async findLowStock() {
    return await this.productRepo.createQueryBuilder('product')
      .where('product.current_stock <= product.min_stock')
      .getMany();
  }
}