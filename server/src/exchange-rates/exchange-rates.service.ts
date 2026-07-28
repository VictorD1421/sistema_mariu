import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly repository: Repository<ExchangeRate>,
  ) {}

  async create(createDto: CreateExchangeRateDto) {
    const newRate = this.repository.create(createDto);
    return await this.repository.save(newRate);
  }

  async getLatestRates() {
    const usd = await this.repository.findOne({
      where: { currency: 'USD' },
      order: { createdAt: 'DESC' },
    });
    
    const eur = await this.repository.findOne({
      where: { currency: 'EUR' },
      order: { createdAt: 'DESC' },
    });

    return {
      usd: usd?.value || 0,
      eur: eur?.value || 0,
      updatedAt: usd?.createdAt || new Date(),
    };
  }
}