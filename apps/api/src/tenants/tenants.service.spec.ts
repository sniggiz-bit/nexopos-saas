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
