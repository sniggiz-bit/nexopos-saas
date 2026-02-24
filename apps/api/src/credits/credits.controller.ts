import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) { }

  @Post()
  create(@Body() createCreditDto: CreateCreditDto) {
    return this.creditsService.create(createCreditDto);
  }

  @Get()
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.creditsService.findAll(tenantId, customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditsService.findOne(id);
  }

  @Post(':id/pay')
  addPayment(@Param('id') id: string, @Body() addPaymentDto: AddPaymentDto) {
    return this.creditsService.addPayment(id, addPaymentDto);
  }
}
