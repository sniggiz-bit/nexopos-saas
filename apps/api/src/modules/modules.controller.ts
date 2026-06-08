import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  updateModule(@Param('id') id: string, @Body() data: { price: number }) {
    return this.modulesService.updateModule(id, data);
  }

  @Get('me')
  getMyModules(@Req() req: any) {
    if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
    return this.modulesService.getModulesForTenant(req.user.tenantId);
  }

  @Post('me/addons')
  setMyAddons(@Req() req: any, @Body('moduleIds') moduleIds: string[]) {
    if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
    return this.modulesService.setTenantAddons(req.user.tenantId, moduleIds);
  }

  @UseGuards(SuperAdminGuard)
  @Get('tenant/:tenantId')
  getModulesForTenant(@Param('tenantId') tenantId: string) {
    return this.modulesService.getModulesForTenant(tenantId);
  }

  @UseGuards(SuperAdminGuard)
  @Post('tenant/:tenantId/addons')
  setTenantAddons(
    @Param('tenantId') tenantId: string,
    @Body('moduleIds') moduleIds: string[]
  ) {
    return this.modulesService.setTenantAddons(tenantId, moduleIds);
  }
}
