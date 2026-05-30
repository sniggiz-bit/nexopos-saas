import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ResourceLimitGuard } from '../auth/resource-limit.guard';
import { CheckLimit } from '../auth/decorators/check-limit.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(ResourceLimitGuard)
  @CheckLimit('maxUsers')
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() requestingUser: any) {
    // 1. Roles permitidos para crear usuarios
    if (requestingUser.role === UserRole.CASHIER || requestingUser.role === UserRole.MANAGER) {
      throw new ForbiddenException('No tienes permisos para crear usuarios.');
    }

    // 2. Aislamiento por Tenant
    if (requestingUser.role !== UserRole.SUPER_ADMIN) {
      createUserDto.tenantId = requestingUser.tenantId;
      // No permitir que un Tenant Admin asigne el rol de SUPER_ADMIN
      if (createUserDto.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes crear usuarios con el rol de Super Administrador.');
      }
    }

    return this.usersService.create(createUserDto, requestingUser);
  }

  @Get()
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('role') role: UserRole,
    @CurrentUser() requestingUser: any,
  ) {
    let targetTenantId = tenantId;

    if (requestingUser.role !== UserRole.SUPER_ADMIN) {
      targetTenantId = requestingUser.tenantId;
    } else if (!targetTenantId) {
      throw new BadRequestException('tenantId es requerido para Super Administradores.');
    }

    return this.usersService.findAll(targetTenantId, role, requestingUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() requestingUser: any) {
    return this.usersService.findOne(id, requestingUser);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() requestingUser: any,
  ) {
    // 1. Roles permitidos para editar usuarios
    if (requestingUser.role === UserRole.CASHIER || requestingUser.role === UserRole.MANAGER) {
      throw new ForbiddenException('No tienes permisos para editar usuarios.');
    }

    // 2. Si no es SUPER_ADMIN, no puede asignar el rol de SUPER_ADMIN
    if (requestingUser.role !== UserRole.SUPER_ADMIN && updateUserDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puedes asignar el rol de Super Administrador.');
    }

    return this.usersService.update(id, updateUserDto, requestingUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() requestingUser: any) {
    // 1. Roles permitidos para eliminar usuarios
    if (requestingUser.role === UserRole.CASHIER || requestingUser.role === UserRole.MANAGER) {
      throw new ForbiddenException('No tienes permisos para eliminar usuarios.');
    }

    // 2. Auto-eliminación
    if (id === requestingUser.id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta.');
    }

    return this.usersService.remove(id, requestingUser);
  }
}

