import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantsService', () => {
    let service: TenantsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        $transaction: jest.fn(),
        tenant: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<TenantsService>(TenantsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createWithDefaults', () => {
        it('should create tenant, branch, user and settings in a transaction', async () => {
            const data = {
                tenant: { name: 'Test Tenant', slug: 'test-tenant' },
                admin: { email: 'admin@test.com', name: 'Admin', password: 'hashed' },
            };

            const mockTx = {
                tenant: { create: jest.fn().mockResolvedValue({ id: 't1', ...data.tenant }) },
                branch: { create: jest.fn().mockResolvedValue({ id: 'b1', name: 'Casa Matriz' }) },
                user: { create: jest.fn().mockResolvedValue({ id: 'u1', email: data.admin.email }) },
                tenantSettings: { create: jest.fn().mockResolvedValue({ id: 's1' }) },
            };

            (prisma.$transaction as jest.Mock).mockImplementation((cb) => cb(mockTx));

            const result = await service.createWithDefaults(data);

            expect(result).toBeDefined();
            expect(mockTx.tenant.create).toHaveBeenCalled();
            expect(mockTx.branch.create).toHaveBeenCalled();
            expect(mockTx.user.create).toHaveBeenCalled();
            expect(mockTx.tenantSettings.create).toHaveBeenCalled();
            expect(result.tenant.id).toBe('t1');
        });
    });

    describe('administrative account creation', () => {
        it('audits the actor inside the same transaction as the new account', async () => {
            const tx = {
                tenant: { create: jest.fn().mockResolvedValue({ id: 't1' }) },
                branch: { create: jest.fn().mockResolvedValue({ id: 'b1' }) },
                user: { create: jest.fn().mockResolvedValue({ id: 'u1' }) },
                tenantSettings: { create: jest.fn().mockResolvedValue({}) },
                systemLog: { create: jest.fn().mockResolvedValue({}) },
            };
            mockPrismaService.$transaction.mockImplementation(cb => cb(tx));
            const data = { tenant: { name: 'Client', slug: 'client' }, admin: { email: 'admin@client.cl', password: 'hash', role: 'TENANT_ADMIN' as const }, actorId: 'superadmin' };
            await service.createWithDefaults(data);
            expect(tx.systemLog.create).toHaveBeenCalledWith({ data: {
                tenantId: 't1', level: 'INFO', message: 'CLIENT_ADMIN_ACTION',
                context: { actorId: 'superadmin', action: 'CLIENT_CREATED', userId: 'u1' },
            } });
            expect(tx.branch.create).toHaveBeenCalledWith({ data: expect.objectContaining({ isMain: true, isActive: true }) });
            expect(tx.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: 't1', branchId: 'b1' }) });
            tx.systemLog.create.mockRejectedValueOnce(new Error('Audit unavailable'));
            await expect(service.createWithDefaults(data)).rejects.toThrow('Audit unavailable');
        });
    });

    describe('suspend', () => {
        it('should update tenant status to SUSPENDED', async () => {
            (prisma.tenant.update as jest.Mock).mockResolvedValue({ id: 't1', status: 'SUSPENDED' });

            const result = await service.suspend('t1');

            expect(result.status).toBe('SUSPENDED');
            expect(prisma.tenant.update).toHaveBeenCalledWith({
                where: { id: 't1' },
                data: { status: 'SUSPENDED' },
            });
        });
    });
});
