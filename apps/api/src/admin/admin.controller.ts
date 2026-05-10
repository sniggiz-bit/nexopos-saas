import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('tenants')
  async getTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTenants(Number(page), Number(limit), search);
  }

  @Get('tenants/:id/metrics')
  async getTenantMetrics(@Param('id') id: string) {
    return this.adminService.getTenantMetrics(id);
  }

  @Patch('tenants/:id/status')
  async toggleStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.toggleTenantStatus(id, status);
  }
}
