import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('UsersService (Multi-Tenant & Authorization)', () => {
  let service: UsersService;
  let prisma: PrismaService;

  // Mock de PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      email: 'new@tenant.cl',
      password: 'password123',
      role: UserRole.MANAGER,
      tenantId: 'tenant-target',
    };

    it('debe lanzar ForbiddenException si un CASHIER intenta crear un usuario', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.CASHIER };
      await expect(service.create(dto, requester)).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ForbiddenException si un TENANT_ADMIN intenta crear un SUPER_ADMIN', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      const superAdminDto = { ...dto, role: UserRole.SUPER_ADMIN };
      await expect(service.create(superAdminDto, requester)).rejects.toThrow(ForbiddenException);
    });

    it('debe inyectar tenantId del solicitante si no es SUPER_ADMIN', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({ id: 'new-u', ...dto, tenantId: 'tenant-1' });

      await service.create(dto, requester);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('debe lanzar ForbiddenException si el usuario pertenece a otro tenant', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'target-u',
        tenantId: 'tenant-2',
      });

      await expect(service.findOne('target-u', requester)).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir la consulta si el solicitante es SUPER_ADMIN', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.SUPER_ADMIN };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'target-u',
        tenantId: 'tenant-2',
      });

      const res = await service.findOne('target-u', requester);
      expect(res.id).toBe('target-u');
    });
  });

  describe('update', () => {
    it('debe lanzar ForbiddenException si un TENANT_ADMIN intenta degradar o editar un SUPER_ADMIN', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'super-u',
        tenantId: 'tenant-1',
        role: UserRole.SUPER_ADMIN,
      });

      await expect(service.update('super-u', { role: UserRole.MANAGER }, requester)).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException al intentar degradar al ultimo administrador del tenant', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-u',
        tenantId: 'tenant-1',
        role: UserRole.TENANT_ADMIN,
      });
      mockPrismaService.user.count.mockResolvedValue(1);

      await expect(service.update('admin-u', { role: UserRole.MANAGER }, requester)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('debe lanzar BadRequestException al intentar auto-eliminarse', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      await expect(service.remove('u1', requester)).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException al intentar eliminar al ultimo administrador del tenant', async () => {
      const requester = { id: 'u1', tenantId: 'tenant-1', role: UserRole.TENANT_ADMIN };
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-u',
        tenantId: 'tenant-1',
        role: UserRole.TENANT_ADMIN,
      });
      mockPrismaService.user.count.mockResolvedValue(1);

      await expect(service.remove('admin-u', requester)).rejects.toThrow(BadRequestException);
    });
  });
});
