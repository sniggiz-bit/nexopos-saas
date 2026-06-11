import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@ApiTags('inquilinos (tenants)')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Listar todos los inquilinos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200 })
  @Get()
  async findAll(@Query('search') search?: string) {
    return this.tenantsService.findAll(search);
  }

  // Accessible by any authenticated user for their own tenant
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener un inquilino por ID' })
  @ApiResponse({ status: 200 })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && req.user?.tenantId !== id) {
      throw new ForbiddenException('Solo puedes acceder a los datos de tu propio tenant.');
    }
    return this.tenantsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar configuración del inquilino' })
  @ApiResponse({ status: 200 })
  @Patch(':id/settings')
  updateSettings(@Param('id') id: string, @Body() dto: UpdateTenantSettingsDto) {
    return this.tenantsService.updateSettings(id, dto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Suspender inquilino' })
  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Activar inquilino' })
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar plan del inquilino' })
  @Patch(':id/plan')
  updatePlan(@Param('id') id: string, @Body('planId') planId: string | null) {
    return this.tenantsService.updatePlan(id, planId);
  }
}
