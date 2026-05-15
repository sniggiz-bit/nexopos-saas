import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.dashboardService.getStats(user.tenantId, branchId);
  }

  @Get('analytics')
  async getAnalytics(
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.dashboardService.getAnalytics(user.tenantId, branchId);
  }
}
