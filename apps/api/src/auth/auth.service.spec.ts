import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwt: JwtService;
    let email: EmailService;
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

    const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    };

    const mockTenantsService = {
        createWithDefaults: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: EmailService, useValue: mockEmailService },
                { provide: TenantsService, useValue: mockTenantsService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwt = module.get<JwtService>(JwtService);
        email = module.get<EmailService>(EmailService);
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
            expect(email.sendWelcomeEmail).toHaveBeenCalled();
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
});
