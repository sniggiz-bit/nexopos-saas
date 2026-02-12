
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Post()
    create(@Body() createQuoteDto: CreateQuoteDto) {
        return this.quotesService.create(createQuoteDto);
    }

    @Get()
    findAll(@Query('tenantId') tenantId: string = 'tenant-1') {
        return this.quotesService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.quotesService.findOne(id);
    }

    @Get(':id/pdf')
    async generatePdf(@Param('id') id: string, @Res() res: Response) {
        const buffer = await this.quotesService.generatePdf(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=cotizacion-${id}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
        return this.quotesService.update(id, updateQuoteDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.quotesService.remove(id);
    }
}
