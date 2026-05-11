import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from './../src/auth/auth.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { EmailService } from './../src/email/email.service';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
    let app: INestApplication<App>;

    const mockPrismaService = {
        user: { findUnique: jest.fn(), create: jest.fn() },
        tenant: { findUnique: jest.fn(), create: jest.fn() },
        branch: { create: jest.fn() },
        tenantSettings: { create: jest.fn() },
        $transaction: jest.fn((cb) => cb(mockPrismaService)),
    };

    const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                AuthModule,
            ],
        })
            .overrideProvider(PrismaService).useValue(mockPrismaService)
            .overrideProvider(EmailService).useValue(mockEmailService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api'); // Important: Match main.ts prefix
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/auth/register-tenant (POST)', () => {
        it('should return 400 if validation fails', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register-tenant')
                .send({ email: 'invalid' })
                .expect(400);
        });

        it('should succeed with valid data', () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.tenant.findUnique.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: 'TENANT_ADMIN' });
            mockPrismaService.tenant.create.mockResolvedValue({ id: 't1', name: 'Test' });
            mockPrismaService.branch.create.mockResolvedValue({ id: 'b1', name: 'Casa Matriz' });

            return request(app.getHttpServer())
                .post('/api/auth/register-tenant')
                .send({
                    companyName: 'Test Corp',
                    userName: 'Admin',
                    email: 'admin@test.com',
                    phone: '123456789',
                    password: 'password123',
                })
                .expect(201);
        });
    });
});
