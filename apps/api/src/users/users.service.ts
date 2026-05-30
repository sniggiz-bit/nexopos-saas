import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto, requestingUser: any) {
    // 1. Doble Capa: Validar rol del solicitante
    if (requestingUser.role === UserRole.CASHIER || requestingUser.role === UserRole.MANAGER) {
      throw new ForbiddenException('No tienes permisos para crear usuarios.');
    }

    const { email, password, role, branchId, tenantId, name } = createUserDto;

    // 2. Doble Capa: Validar Aislamiento Multi-Tenant
    let targetTenantId = tenantId;
    if (requestingUser.role !== UserRole.SUPER_ADMIN) {
      targetTenantId = requestingUser.tenantId;
      if (role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes crear usuarios con el rol de Super Administrador.');
      }
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya se encuentra registrado.');
    }

    const saltRounds = 10;
    const hashedPassword = password ? await bcrypt.hash(password, saltRounds) : null;

    return this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: (role as UserRole) || UserRole.MANAGER,
        branchId,
        tenantId: targetTenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async findAll(tenantId: string, role: UserRole | undefined, requestingUser: any) {
    // 1. Doble Capa: Validar Aislamiento Multi-Tenant
    if (requestingUser.role !== UserRole.SUPER_ADMIN && tenantId !== requestingUser.tenantId) {
      throw new ForbiddenException('No tienes acceso a los usuarios de este tenant.');
    }

    return this.prisma.user.findMany({
      where: {
        tenantId,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tenantId: true,
        branchId: true,
        branch: {
          select: { id: true, name: true }
        }
      },
    });
  }

  async findOne(id: string, requestingUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tenantId: true,
        branchId: true,
        branch: {
          select: { id: true, name: true }
        },
        shiftsOpened: {
          where: { status: 'OPEN' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 1. Doble Capa: Validar Aislamiento Multi-Tenant
    if (requestingUser.role !== UserRole.SUPER_ADMIN && user.tenantId !== requestingUser.tenantId) {
      throw new ForbiddenException('No tienes acceso a este usuario.');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUser: any) {
    // 1. Doble Capa: Validar roles permitidos
    if (requestingUser.role === UserRole.CASHIER || requestingUser.role === UserRole.MANAGER) {
      throw new ForbiddenException('No tienes permisos para editar usuarios.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 2. Doble Capa: Validar Aislamiento Multi-Tenant
    if (requestingUser.role !== UserRole.SUPER_ADMIN && targetUser.tenantId !== requestingUser.tenantId) {
      throw new ForbiddenException('No tienes acceso a este usuario.');
    }

    // 3. Doble Capa: Jerarquía de Roles
    if (requestingUser.role !== UserRole.SUPER_ADMIN) {
      if (targetUser.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes modificar a un Super Administrador.');
      }
      if (updateUserDto.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('No puedes asignar el rol de Super Administrador.');
      }
    }

    // 4. Regla de Negocio: Último Administrador (degradación)
    if (updateUserDto.role && updateUserDto.role !== UserRole.TENANT_ADMIN && targetUser.role === UserRole.TENANT_ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { tenantId: targetUser.tenantId, role: UserRole.TENANT_ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('No puedes degradar al único administrador del tenant.');
      }
    }

    const data = { ...updateUserDto };

    if (data.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async remove(id: string, requestingUser: any) {
    // 1. Doble Capa: Validar roles permitidos
    if (requestingUser.role === UserRole.CASHIER || requestingUser.role === UserRole.MANAGER) {
      throw new ForbiddenException('No tienes permisos para eliminar usuarios.');
    }

    // 2. Doble Capa: Auto-eliminación
    if (id === requestingUser.id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 3. Doble Capa: Validar Aislamiento Multi-Tenant
    if (requestingUser.role !== UserRole.SUPER_ADMIN && targetUser.tenantId !== requestingUser.tenantId) {
      throw new ForbiddenException('No tienes acceso a este usuario.');
    }

    // 4. Doble Capa: Jerarquía de Roles
    if (requestingUser.role !== UserRole.SUPER_ADMIN && targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puedes eliminar a un Super Administrador.');
    }

    // 5. Regla de Negocio: Último Administrador (eliminación)
    if (targetUser.role === UserRole.TENANT_ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { tenantId: targetUser.tenantId, role: UserRole.TENANT_ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('No puedes eliminar al único administrador del tenant.');
      }
    }

    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
  }
}
