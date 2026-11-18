import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { WelcomeEmailsService } from './welcome-emails.service';

describe('Welcome email tracking', () => {
  let service: WelcomeEmailsService;
  let prisma: any;
  let email: any;
  beforeEach(() => {
    prisma = {
      tenant: { findUnique: jest.fn().mockResolvedValue({ id: 't1' }) },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'u1', name: 'Owner', email: 'owner@example.cl', tenant: { name: 'Shop', status: 'ACTIVE' } }),
        findMany: jest.fn().mockResolvedValue([{ id: 'u1', name: 'Owner', email: 'owner@example.cl' }]),
      },
      systemLog: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'log1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    email = { getWelcomeConfiguration: jest.fn().mockReturnValue({ configured: true, reason: null }), sendWelcomeEmail: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerId: 'resend1' }) };
    service = new WelcomeEmailsService(prisma, email);
  });

  it('checks tenant membership before sending and does not reset credentials', async () => {
    await expect(service.send('t1', 'u1', 'super1')).resolves.toHaveProperty('status', 'ACCEPTED');
    expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1', tenantId: 't1', role: 'TENANT_ADMIN' } }));
    expect(prisma.systemLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 't1', context: { userId: 'u1', requestedBy: 'super1', status: 'PENDING' } }) }));
    expect(prisma.systemLog.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ context: expect.objectContaining({ status: 'ACCEPTED', providerId: 'resend1' }) }) }));
    expect(email.sendWelcomeEmail).toHaveBeenCalledWith('owner@example.cl', 'Owner', { email: 'owner@example.cl', companyName: 'Shop' });
  });

  it('does not send to a user from a different tenant or role', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.send('t1', 'other')).rejects.toThrow(NotFoundException);
    expect(email.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('does not send to a suspended company', async () => {
    prisma.user.findFirst.mockResolvedValue({ tenant: { status: 'SUSPENDED' } });
    await expect(service.send('t1', 'u1')).rejects.toThrow(BadRequestException);
    expect(email.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('records provider failures so they are visible to the superadmin', async () => {
    email.sendWelcomeEmail.mockResolvedValue({ status: 'FAILED', error: 'Resend rejected request' });
    await service.send('t1', 'u1');
    expect(prisma.systemLog.update).toHaveBeenCalledWith(expect.objectContaining({ data: { level: 'WARNING', context: expect.objectContaining({ status: 'FAILED' }) } }));
  });

  it('prevents rapid repeat requests', async () => {
    prisma.systemLog.findFirst.mockResolvedValue({ createdAt: new Date() });
    await expect(service.send('t1', 'u1')).rejects.toThrow(ConflictException);
    expect(email.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('blocks concurrent requests while the first send is in flight', async () => {
    let release!: (value: { status: string }) => void;
    let started!: () => void;
    const sending = new Promise<void>(resolve => { started = resolve; });
    email.sendWelcomeEmail.mockImplementation(() => { started(); return new Promise(resolve => { release = resolve; }); });
    const first = service.send('t1', 'u1');
    await sending;
    await expect(service.send('t1', 'u1')).rejects.toThrow(ConflictException);
    release({ status: 'ACCEPTED' });
    await first;
    expect(email.sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  it('does not send when creating the audit record fails', async () => {
    prisma.systemLog.create.mockRejectedValue(new Error('DB unavailable'));
    await expect(service.send('t1', 'u1')).rejects.toThrow('DB unavailable');
    expect(email.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('shows old accounts as unknown rather than inventing a delivery state', async () => {
    const status = await service.getStatus('t1');
    expect(status.users[0].attempt).toBeNull();
  });

  it('rejects status requests for a missing company', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);
    await expect(service.getStatus('missing')).rejects.toThrow(NotFoundException);
  });
});
