import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CommonController } from './common.controller';
import { RegistrationRutService } from './registration-rut.service';
import { LiorenService } from '../dte/lioren.service';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';

describe('Registration RUT endpoint', () => {
  let app: INestApplication;
  const registration = { lookup: jest.fn().mockResolvedValue({ success: false, message: 'Completa manualmente.' }) };
  const provider = { consultaRut: jest.fn().mockResolvedValue({ success: true, data: {} }) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [CommonController], providers: [
      { provide: RegistrationRutService, useValue: registration },
      { provide: LiorenService, useValue: provider },
    ] }).compile();
    const reflector = module.get(Reflector);
    app = module.createNestApplication();
    app.useGlobalGuards({ canActivate(context: ExecutionContext) {
      if (reflector.getAllAndOverride(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
      const req = context.switchToHttp().getRequest();
      if (!req.headers.authorization) throw new UnauthorizedException();
      req.user = { tenantId: 'existing-tenant' };
      return true;
    } });
    await app.init();
  });
  afterAll(async () => { await app?.close(); });

  it('allows registration lookups before a user account exists', async () => {
    await request(app.getHttpServer()).get('/common/registration-rut-lookup/123456785').expect(200);
    expect(registration.lookup).toHaveBeenCalledWith('123456785', expect.any(String));
  });
  it('keeps the existing customer and supplier lookup authenticated', async () => {
    await request(app.getHttpServer()).get('/common/rut-lookup/123456785').expect(401);
  });
  it('preserves the existing authenticated lookup and tenant argument', async () => {
    await request(app.getHttpServer()).get('/common/rut-lookup/123456785').set('Authorization', 'fixture').expect(200);
    expect(provider.consultaRut).toHaveBeenCalledWith('123456785', 'existing-tenant');
  });
});
