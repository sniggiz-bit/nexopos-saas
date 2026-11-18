import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

const EVENT = 'WELCOME_EMAIL';

@Injectable()
export class WelcomeEmailsService {
  private readonly logger = new Logger(WelcomeEmailsService.name);
  private readonly inFlight = new Set<string>();

  constructor(private readonly prisma: PrismaService, private readonly email: EmailService) {}

  private latest(tenantId: string, userId: string) {
    return this.prisma.systemLog.findFirst({
      where: { tenantId, message: EVENT, context: { path: ['userId'], equals: userId } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async getStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Empresa no encontrada.');
    const admins = await this.prisma.user.findMany({
      where: { tenantId, role: 'TENANT_ADMIN' },
      select: { id: true, name: true, email: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const users = await Promise.all(admins.map(async user => {
      const log = await this.latest(tenantId, user.id);
      const context = log?.context as Record<string, unknown> | null;
      return { ...user, attempt: log ? {
        status: context?.status,
        attemptedAt: log.createdAt,
        providerId: context?.providerId,
        error: context?.error,
      } : null };
    }));
    return { ...this.email.getWelcomeConfiguration(), users };
  }

  async send(tenantId: string, userId: string, requestedBy?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, role: 'TENANT_ADMIN' },
      select: { id: true, name: true, email: true, tenant: { select: { name: true, status: true } } },
    });
    if (!user) throw new NotFoundException('Administrador no encontrado en esta empresa.');
    if (user.tenant.status !== 'ACTIVE') throw new BadRequestException('Activa la empresa antes de enviar la bienvenida.');
    if (this.inFlight.has(userId)) throw new ConflictException('Ya hay un envío en curso para este usuario.');
    this.inFlight.add(userId);
    try {
      const last = await this.latest(tenantId, userId);
      if (last && Date.now() - last.createdAt.getTime() < 60000) {
        throw new ConflictException('Espera un minuto antes de volver a enviar la bienvenida.');
      }
      // Crear el registro antes de contactar al proveedor. No persistir contraseñas.
      const context = { userId, requestedBy: requestedBy || 'registration', status: 'PENDING' };
      const attempt = await this.prisma.systemLog.create({
        data: { tenantId, level: 'INFO', message: EVENT, context },
      });
      const result = await this.email.sendWelcomeEmail(user.email, user.name || user.email, {
        email: user.email, companyName: user.tenant.name,
      });
      try {
        await this.prisma.systemLog.update({
          where: { id: attempt.id },
          data: { level: result.status === 'ACCEPTED' ? 'INFO' : 'WARNING', context: { ...context, ...result } },
        });
      } catch {
        // El proveedor puede haber aceptado el envío aunque falle guardar su resultado.
        this.logger.error('Could not persist welcome email result; check provider before retrying.');
      }
      return result;
    } finally {
      this.inFlight.delete(userId);
    }
  }
}
