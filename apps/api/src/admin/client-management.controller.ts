import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UpdateTenantSettingsDto } from '../tenants/dto/update-tenant-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { BranchesService } from '../branches/branches.service';
import { ModulesService } from '../modules/modules.service';
import { ClientManagementService } from './client-management.service';
import { ClientDeletionService } from './client-deletion.service';
import { AuthService } from '../auth/auth.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientBranchDto, ClientModulesDto, ClientProfileDto, ClientUserDto, DeleteClientDto, DeleteClientUserDto } from './dto/client-management.dto';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class ClientManagementController {
  constructor(private clients: ClientManagementService, private branches: BranchesService, private modules: ModulesService, private deletion: ClientDeletionService, private auth: AuthService) {}
  @Post()
  create(@Body() dto: CreateClientDto, @Request() req: { user: { sub: string } }) { return this.auth.createClient(dto, req.user.sub); }
  @Post('deleted-records/:auditId/cleanup')
  retryCleanup(@Param('auditId') auditId: string, @Request() req: any) { return this.deletion.retryCleanup(auditId, req.user.sub); }
  @Get(':id')
  detail(@Param('id') id: string) { return this.clients.detail(id); }
  @Patch(':id/plan')
  updatePlan(@Param('id') id: string, @Body('planId') planId: string | null, @Request() req: any) { return this.clients.updatePlan(id, planId, req.user.sub); }
  @Patch(':id/settings')
  updateSettings(@Param('id') id: string, @Body() dto: UpdateTenantSettingsDto, @Request() req: any) { return this.clients.updateSettings(id, dto, req.user.sub); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ClientProfileDto, @Request() req: any) { return this.clients.updateProfile(id, dto, req.user.sub); }
  @Get(':id/dte-records')
  dteRecords(@Param('id') id: string) { return this.clients.dteRecords(id); }
  @Get(':id/deletion-preview')
  preview(@Param('id') id: string) { return this.deletion.preview(id); }
  @Delete(':id')
  remove(@Param('id') id: string, @Body() dto: DeleteClientDto, @Request() req: any) { return this.deletion.remove(id, dto.confirmation, dto.password, req.user.sub); }
  @Post(':id/users')
  createUser(@Param('id') id: string, @Body() dto: ClientUserDto, @Request() req: any) { return this.clients.createUser(id, dto, req.user.sub); }
  @Patch(':id/users/:userId')
  updateUser(@Param('id') id: string, @Param('userId') userId: string, @Body() dto: ClientUserDto, @Request() req: any) { return this.clients.updateUser(id, userId, dto, req.user.sub); }
  @Delete(':id/users/:userId')
  removeUser(@Param('id') id: string, @Param('userId') userId: string, @Body() dto: DeleteClientUserDto, @Request() req: any) { return this.clients.removeUser(id, userId, dto.confirmation, req.user.sub); }
  @Post(':id/branches')
  createBranch(@Param('id') id: string, @Body() dto: ClientBranchDto, @Request() req: any) { return this.branches.create({ ...dto, name: dto.name || '', tenantId: id }, req.user.sub); }
  @Patch(':id/branches/:branchId')
  updateBranch(@Param('id') id: string, @Param('branchId') branchId: string, @Body() dto: ClientBranchDto, @Request() req: any) { return this.branches.updateForTenant(id, branchId, dto, req.user.sub); }
  @Delete(':id/branches/:branchId')
  removeBranch(@Param('id') id: string, @Param('branchId') branchId: string, @Request() req: any) { return this.branches.removeForTenant(id, branchId, req.user.sub); }
  @Patch(':id/modules')
  async updateModules(@Param('id') id: string, @Body() dto: ClientModulesDto, @Request() req: any) { const result = await this.modules.setTenantAccess(id, dto.overrides, req.user.sub); this.clients.revokeSessions(id); return result; }
}
