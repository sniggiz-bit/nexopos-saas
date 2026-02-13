import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getStats(
        @Query('tenantId') tenantId: string,
        @Query('branchId') branchId?: string,
    ) {
        return this.dashboardService.getStats(tenantId, branchId);
    }
}
