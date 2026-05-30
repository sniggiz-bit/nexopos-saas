import { Test, TestingModule } from '@nestjs/testing';
import { ResourceLimitGuard } from './resource-limit.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ResourceLimitGuard', () => {
  let guard: ResourceLimitGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrismaService = {
    tenantSettings: {
      findUnique: jest.fn(),
    },
    branch: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceLimitGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<ResourceLimitGuard>(ResourceLimitGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  const getMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request if no limit metadata key is set', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = getMockContext({ tenantId: 'tenant-1' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user is not in request (no auth context)', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxBranches');
    const context = getMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user tenantId is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxBranches');
    const context = getMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if tenant settings are not found', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxBranches');
    const context = getMockContext({ tenantId: 'tenant-1' });
    mockPrismaService.tenantSettings.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should allow access (fail-safe) if database model does not exist on Prisma', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxRegisters'); // Points to 'register' which isn't defined in mockPrismaService
    const context = getMockContext({ tenantId: 'tenant-1' });
    mockPrismaService.tenantSettings.findUnique.mockResolvedValue({
      maxRegisters: 2,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access if count is less than the limit', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxBranches');
    const context = getMockContext({ tenantId: 'tenant-1' });
    mockPrismaService.tenantSettings.findUnique.mockResolvedValue({
      maxBranches: 3,
    });
    mockPrismaService.branch.count.mockResolvedValue(2);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrismaService.branch.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
  });

  it('should throw ForbiddenException if count is equal to the limit', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxBranches');
    const context = getMockContext({ tenantId: 'tenant-1' });
    mockPrismaService.tenantSettings.findUnique.mockResolvedValue({
      maxBranches: 3,
    });
    mockPrismaService.branch.count.mockResolvedValue(3);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if count is greater than the limit', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('maxBranches');
    const context = getMockContext({ tenantId: 'tenant-1' });
    mockPrismaService.tenantSettings.findUnique.mockResolvedValue({
      maxBranches: 3,
    });
    mockPrismaService.branch.count.mockResolvedValue(4);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
