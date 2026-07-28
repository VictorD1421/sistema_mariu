import { Controller, Get, Post, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';

const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('exchange-rates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post()
  @Roles('ADMIN', 'SUPERUSER')
  create(@Body() createDto: CreateExchangeRateDto) {
    return this.exchangeRatesService.create(createDto);
  }

  @Get('latest')
  latest() {
    return this.exchangeRatesService.getLatestRates();
  }
}