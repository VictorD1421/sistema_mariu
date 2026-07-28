import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async createReport(reportData: Partial<Report>) {
    const newReport = this.reportRepository.create({
      type: reportData.type,
      description: reportData.description,
      data: reportData.data,
    });

    return await this.reportRepository.save(newReport);
  }

  async findAll() {
    return await this.reportRepository.find({ 
      order: { created_at: 'DESC' } 
    });
  }

  async findOne(id: number) {
    return await this.reportRepository.findOneBy({ id });
  }

  async getYearlyStats() {
    const today = new Date();
    
    return {
      title: `Balance Anual Consolidado ${today.getFullYear()}`,
      generated_at: today,
      total_sales: 745, 
      total_revenue: 22430.50,
      top_product: 'Equipos Especializados INSAI',
    };
  }
}