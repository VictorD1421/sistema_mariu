import { Controller, Post, Get, Body, UseGuards, Request, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return await this.salesService.create(createSaleDto, req.user.userId);
  }

  @Get()
  async findAll(@Query('date') date?: string) {
    return await this.salesService.findAll(date);
  }

  @Get('stats')
  async getDashboardStats() {
    return await this.salesService.getStats();
  }

  @Get('weekly-report')
  async getWeeklyReport() {
    return await this.salesService.getWeeklyReportData();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.salesService.findOne(id);
  }
}