import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async saveReport(@Body() reportData: Partial<Report>) {
    return await this.reportsService.createReport(reportData);
  }

  @Get()
  async findAll() {
    return await this.reportsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.reportsService.findOne(id);
  }

  @Get('stats/yearly')
  async getYearlyStats() {
    return await this.reportsService.getYearlyStats();
  }
}