import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Body,
  Put,
  Post,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { WelcomeEmailsService } from '../email/welcome-emails.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService, private readonly welcomeEmails: WelcomeEmailsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('tenants')
  async getTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getTenants(Number(page), Number(limit), search, status);
  }

  @Get('tenants/:id/metrics')
  async getTenantMetrics(@Param('id') id: string) {
    return this.adminService.getTenantMetrics(id);
  }

  @Patch('tenants/:id/status')
  async toggleStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.adminService.toggleTenantStatus(id, status, req.user.sub);
  }

  @Get('tenants/:id/welcome-email')
  getWelcomeStatus(@Param('id') id: string) {
    return this.welcomeEmails.getStatus(id);
  }

  @Post('tenants/:id/users/:userId/welcome-email')
  sendWelcome(@Param('id') id: string, @Param('userId') userId: string, @Request() req: { user: { sub: string } }) {
    return this.welcomeEmails.send(id, userId, req.user.sub);
  }

  @Get('landing')
  async getLanding() {
    return this.adminService.getLandingConfig();
  }

  @Put('landing')
  async updateLanding(@Body() body: Record<string, any>) {
    return this.adminService.updateLandingConfig(body);
  }
}
