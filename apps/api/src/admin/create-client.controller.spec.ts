import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ClientManagementController } from './client-management.controller';
import { ClientManagementService } from './client-management.service';
import { ClientDeletionService } from './client-deletion.service';
import { BranchesService } from '../branches/branches.service';
import { ModulesService } from '../modules/modules.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('Create client endpoint', () => {
  let app: INestApplication;
  const auth = { createClient: jest.fn() };
  const dto = { companyName: 'Empresa', userName: 'Administrador', email: 'admin@empresa.cl', phone: '123456789', password: 'password123' };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClientManagementController],
      providers: [
        { provide: AuthService, useValue: auth },
        ...[ClientManagementService, ClientDeletionService, BranchesService, ModulesService].map(provide => ({ provide, useValue: {} })),
      ],
    }).overrideGuard(JwtAuthGuard).useValue({
      canActivate(context: any) {
        const req = context.switchToHttp().getRequest();
        if (req.headers['x-test-role']) req.user = { sub: 'actor', role: req.headers['x-test-role'] };
        return true;
      },
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    await app.init();
  });
  beforeEach(() => { auth.createClient.mockReset(); auth.createClient.mockResolvedValue({ tenant: { id: 'new-client' } }); });
  afterAll(async () => { await app?.close(); });

  it.each([undefined, 'TENANT_ADMIN', 'MANAGER', 'CASHIER'])('rejects creation for role %s', async role => {
    const call = request(app.getHttpServer()).post('/admin/tenants');
    if (role) call.set('x-test-role', role);
    await call.send(dto).expect(403);
    expect(auth.createClient).not.toHaveBeenCalled();
  });

  it('normalizes data and ignores injected role and tenant identifiers', async () => {
    await request(app.getHttpServer()).post('/admin/tenants').set('x-test-role', 'SUPER_ADMIN')
      .send({ ...dto, companyName: ' Empresa ', email: ' ADMIN@EMPRESA.CL ', rut: '', role: 'SUPER_ADMIN', tenantId: 'other' }).expect(201);
    expect(auth.createClient).toHaveBeenCalledWith(expect.objectContaining({ companyName: 'Empresa', email: 'admin@empresa.cl', rut: undefined }), 'actor');
    expect(auth.createClient.mock.calls[0][0]).not.toHaveProperty('role');
    expect(auth.createClient.mock.calls[0][0]).not.toHaveProperty('tenantId');
  });

  it.each([
    { companyName: '   ' }, { userName: ' ' }, { phone: ' ' }, { email: 'invalid' },
    { password: 'short' }, { password: 'a'.repeat(73) }, { rut: '123' },
  ])('validates account input %j', async invalid => {
    await request(app.getHttpServer()).post('/admin/tenants').set('x-test-role', 'SUPER_ADMIN').send({ ...dto, ...invalid }).expect(400);
    expect(auth.createClient).not.toHaveBeenCalled();
  });
});
