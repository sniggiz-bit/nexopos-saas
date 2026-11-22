import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { WelcomeEmailsService } from '../email/welcome-emails.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TenantsService } from '../tenants/tenants.service';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwt: JwtService;
    let email: WelcomeEmailsService;
    let tenants: TenantsService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        tenant: {
            findUnique: jest.fn(),
        },
    };

    const mockJwtService = {
        signAsync: jest.fn(),
        verifyAsync: jest.fn(),
    };

    const mockWelcomeEmailsService = {
        send: jest.fn().mockResolvedValue(true),
    };

    const mockNotificationsService = { notifySuperAdmin: jest.fn().mockResolvedValue({}) };

    const mockTenantsService = {
        createWithDefaults: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockPrismaService.user.findUnique.mockReset();
        mockPrismaService.tenant.findUnique.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: WelcomeEmailsService, useValue: mockWelcomeEmailsService },
                { provide: TenantsService, useValue: mockTenantsService },
                { provide: NotificationsService, useValue: mockNotificationsService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwt = module.get<JwtService>(JwtService);
        email = module.get<WelcomeEmailsService>(WelcomeEmailsService);
        tenants = module.get<TenantsService>(TenantsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user object if password matches (hashed)', async () => {
            const mockUser = {
                id: '1',
                email: 'test@test.com',
                password: '$2b$10$hashedpassword',
                role: 'ADMIN',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateUser('test@test.com', 'password123');

            expect(result).toBeDefined();
            expect(result.email).toBe('test@test.com');
            expect(result.password).toBeUndefined();
        });

        it('should return null if password does not match', async () => {
            const mockUser = {
                id: '1',
                email: 'test@test.com',
                password: '$2b$10$hashedpassword',
                role: 'ADMIN',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validateUser('test@test.com', 'wrongpassword');

            expect(result).toBeNull();
        });

        it('should handle plain text password and update it to hashed', async () => {
            const mockUser = {
                id: '1',
                email: 'test@test.com',
                password: 'plainpassword',
                role: 'ADMIN',
            };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

            const result = await service.validateUser('test@test.com', 'plainpassword');

            expect(result).toBeDefined();
            expect(prisma.user.update).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
        });
    });

    describe('registerTenant', () => {
        it('should register a new tenant and return login data', async () => {
            const dto = {
                companyName: 'Test Corp',
                userName: 'Admin User',
                email: 'admin@testcorp.com',
                phone: '123456789',
                password: 'securepassword123',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null); // Slug check

            const mockResult = {
                tenant: { id: 't1', name: 'Test Corp', slug: 'test-corp' },
                branch: { id: 'b1', name: 'Casa Matriz' },
                user: { id: 'u1', email: dto.email, name: dto.userName, role: 'TENANT_ADMIN' },
            };

            (tenants.createWithDefaults as jest.Mock).mockResolvedValue(mockResult);
            (jwt.signAsync as jest.Mock).mockResolvedValue('mock-token');

            const result = await service.registerTenant(dto);

            expect(result).toBeDefined();
            expect(result.access_token).toBe('mock-token');
            expect(tenants.createWithDefaults).toHaveBeenCalled();
            expect(email.send).toHaveBeenCalledWith('t1', 'u1', undefined, dto.password);
            expect(mockNotificationsService.notifySuperAdmin).toHaveBeenCalledWith(
                'Nuevo usuario registrado', expect.stringContaining(dto.email), 'REGISTRATION',
                { actionPath: '/admin/tenants/t1' },
            );
            expect(JSON.stringify(mockNotificationsService.notifySuperAdmin.mock.calls)).not.toContain(dto.password);
        });

        it('should preserve registration when welcome processing fails', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.tenant.findUnique.mockResolvedValue(null);
            mockTenantsService.createWithDefaults.mockResolvedValue({ tenant: { id: 't1' }, branch: { id: 'b1' }, user: { id: 'u1' } });
            mockWelcomeEmailsService.send.mockRejectedValueOnce(new Error('Email storage unavailable'));
            mockJwtService.signAsync.mockResolvedValue('token');
            await expect(service.registerTenant({ companyName: 'Test', userName: 'User', email: 'user@test.cl', phone: '123', password: 'password' })).resolves.toHaveProperty('access_token', 'token');
        });

        it('should throw ConflictException if email already exists', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

            await expect(service.registerTenant({
                email: 'existing@test.com',
                companyName: 'Test',
                userName: 'User',
                phone: '123',
                password: 'password'
            })).rejects.toThrow(ConflictException);
        });
    });
    describe('createClient', () => {
        const dto = { companyName: 'Nuevo Cliente', userName: 'Admin', email: 'admin@nuevo.cl', phone: '123', password: 'securepassword123' };
        beforeEach(() => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.tenant.findUnique.mockResolvedValue(null);
            mockTenantsService.createWithDefaults.mockReset();
            mockTenantsService.createWithDefaults.mockResolvedValue({
                tenant: { id: 'new-tenant', name: dto.companyName, slug: 'nuevo-cliente' },
                branch: { id: 'new-branch', name: 'Casa Matriz' },
                user: { id: 'new-admin', name: dto.userName, email: dto.email, role: 'TENANT_ADMIN', password: 'secret-hash', tokenVersion: 0 },
            });
            (bcrypt.hash as jest.Mock).mockResolvedValue('secret-hash');
        });

        it('creates an administrator without issuing a token or exposing password hashes', async () => {
            const result = await service.createClient(dto, 'superadmin');
            expect(result.tenant.id).toBe('new-tenant');
            expect(result.user.role).toBe('TENANT_ADMIN');
            expect(result).not.toHaveProperty('access_token');
            expect(result.user).not.toHaveProperty('password');
            expect(result.user).not.toHaveProperty('tokenVersion');
            expect(JSON.stringify(result)).not.toContain(dto.password);
            expect(jwt.signAsync).not.toHaveBeenCalled();
            expect(tenants.createWithDefaults).toHaveBeenCalledWith(expect.objectContaining({
                actorId: 'superadmin',
                admin: expect.objectContaining({ password: 'secret-hash', role: 'TENANT_ADMIN' }),
            }));
            expect(email.send).toHaveBeenCalledWith('new-tenant', 'new-admin', 'superadmin', dto.password);
            expect(JSON.stringify(mockNotificationsService.notifySuperAdmin.mock.calls)).not.toContain(dto.password);
        });

        it('rejects an existing email before creating any resources', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });
            await expect(service.createClient(dto, 'superadmin')).rejects.toThrow(ConflictException);
            expect(tenants.createWithDefaults).not.toHaveBeenCalled();
        });

        it('rejects multibyte passwords exceeding the bcrypt byte limit', async () => {
            await expect(service.createClient({ ...dto, password: '\u00f1'.repeat(37) }, 'superadmin')).rejects.toThrow('72 bytes');
            expect(tenants.createWithDefaults).not.toHaveBeenCalled();
        });

        it('reports concurrent uniqueness conflicts without sending a welcome email', async () => {
            mockTenantsService.createWithDefaults.mockRejectedValue({ code: 'P2002' });
            await expect(service.createClient(dto, 'superadmin')).rejects.toThrow(ConflictException);
            expect(email.send).not.toHaveBeenCalled();
        });

        it('keeps account creation successful when welcome processing fails', async () => {
            mockWelcomeEmailsService.send.mockRejectedValueOnce(new Error('Email unavailable'));
            await expect(service.createClient(dto, 'superadmin')).resolves.toHaveProperty('tenant.id', 'new-tenant');
            expect(jwt.signAsync).not.toHaveBeenCalled();
        });
    });

});
