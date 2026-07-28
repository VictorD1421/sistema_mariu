import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async create(createProviderDto: CreateProviderDto) {
    const provider = this.providerRepository.create(createProviderDto);
    return await this.providerRepository.save(provider);
  }

  async findAll() {
    return await this.providerRepository.find({ order: { id: 'DESC' } });
  }

  async remove(id: number) {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    await this.providerRepository.remove(provider);
    return { success: true };
  }
}