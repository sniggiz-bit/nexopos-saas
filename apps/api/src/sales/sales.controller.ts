import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.createSale(createSaleDto);
    }
}
