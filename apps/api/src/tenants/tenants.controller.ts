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
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @ApiOperation({ summary: 'Listar todos los inquilinos', description: 'Retorna una lista de todas las empresas/tenants registrados en el sistema. Requiere rol SUPER_ADMIN.' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda por nombre o RUT' })
  @ApiResponse({ status: 200, description: 'Lista de inquilinos obtenida exitosamente.' })
  @Get()
  async findAll(@Query('search') search?: string) {
    return this.tenantsService.findAll(search);
  }

  @ApiOperation({ summary: 'Obtener un inquilino por ID' })
  @ApiResponse({ status: 200, description: 'Detalles del inquilino.' })
  @ApiResponse({ status: 404, description: 'Inquilino no encontrado.' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && req.user?.tenantId !== id) {
      throw new ForbiddenException('Solo puedes acceder a los datos de tu propio tenant.');
    }
    return this.tenantsService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar configuración del inquilino', description: 'Permite activar/desactivar módulos y cambiar límites de recursos.' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada.' })
  @Patch(':id/settings')
  updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.tenantsService.updateSettings(id, dto);
  }

  @ApiOperation({ summary: 'Suspender inquilino', description: 'Marca al inquilino como SUSPENDED, bloqueando el acceso a sus usuarios.' })
  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @ApiOperation({ summary: 'Activar inquilino', description: 'Restaura el estado ACTIVE de un inquilino suspendido.' })
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }
}
