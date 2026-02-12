import { Controller, Get, Query } from '@nestjs/common';
import { TreasuryService } from './treasury.service';

@Controller('treasury')
export class TreasuryController {
    constructor(private readonly treasuryService: TreasuryService) { }

    @Get('receivables')
    getReceivables(@Query('tenantId') tenantId: string) {
        return this.treasuryService.getReceivables(tenantId);
    }

    @Get('cash-flow')
    getCashFlow(@Query('tenantId') tenantId: string) {
        return this.treasuryService.getCashFlow(tenantId);
    }

    @Get('maturities')
    getMaturities(@Query('tenantId') tenantId: string) {
        return this.treasuryService.getMaturities(tenantId);
    }
}
