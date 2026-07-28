import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('stock-movements')
@UseGuards(AuthGuard('jwt'))
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  create(@Body() dto: CreateStockMovementDto) {
    return this.stockMovementsService.create(
      dto.productId,
      dto.userId,
      dto.type,
      dto.quantity,
      dto.reason,
    );
  }

  @Get()
  findAll() {
    return this.stockMovementsService.findAll();
  }
}