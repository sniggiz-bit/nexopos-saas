import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { SupportService } from './support.service';

@Injectable()
export class SupportNoticeWorker {
  private running = false;
  private logger = new Logger(SupportNoticeWorker.name);
  constructor(private prisma: PrismaService, private notifications: NotificationsService, private support: SupportService, private events: EventsGateway) {}
  @Cron('*/10 * * * * *')
  async tick() {
    if (process.env.SUPPORT_WORKER_ENABLED === '0' || this.running) return;
    this.running = true;
    try { await this.drainOnce(); } catch { this.logger.error('Could not process support handoff queue.'); }
    finally { this.running = false; }
  }
  async drainOnce() {
    const stale = await this.prisma.chatSession.findMany({ where: { mode: 'BOT', pendingMessageId: { not: null }, pendingSince: { lt: new Date(Date.now() - 45000) } }, select: { id: true }, take: 20 });
    for (const session of stale) await this.support.expireOne(session.id);
    for (let index = 0; index < 5; index++) {
      const notice = await this.prisma.$transaction(async tx => {
        const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(`SELECT "id" FROM "SupportHandoffNotice" WHERE (("status" IN ('PENDING','RETRY') AND "nextAttemptAt"<=NOW()) OR ("status"='SENDING' AND "leaseUntil"<NOW())) ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`);
        if (!rows.length) return null;
        return tx.supportHandoffNotice.update({ where: { id: rows[0].id }, data: { status: 'SENDING', attempts: { increment: 1 }, leaseToken: randomUUID(), leaseUntil: new Date(Date.now() + 60000) } });
      });
      if (!notice) break;
      // Resend retains idempotency keys for 24 hours. Never retry beyond that window.
      if (notice.attempts > 5 || Date.now() - notice.createdAt.getTime() >= 23 * 3600000) {
        await this.prisma.supportHandoffNotice.updateMany({ where: { id: notice.id, leaseToken: notice.leaseToken, status: 'SENDING' }, data: { status: 'FAILED', lastError: 'El envío requiere revisión manual.', leaseToken: null, leaseUntil: null } });
        continue;
      }
      if (notice.attempts === 1) this.events.emitToTenant('superadmin', 'new_notification', { id: notice.notificationId, title: notice.title, message: notice.message, type: 'CHAT', isRead: false, createdAt: notice.createdAt });
      let result: { status: string; providerId?: string; error?: string };
      try { result = await this.notifications.sendEmailNotification(notice.notificationId, notice.title, notice.message, 'CHAT', '/admin/live-chats?session=' + notice.chatSessionId, 'support-handoff/' + notice.id); }
      catch { result = { status: 'FAILED', error: 'No se pudo confirmar el envío.' }; }
      const accepted = result.status === 'ACCEPTED';
      const retry = !accepted && notice.attempts < 5;
      await this.prisma.supportHandoffNotice.updateMany({ where: { id: notice.id, leaseToken: notice.leaseToken, status: 'SENDING' }, data: { status: accepted ? 'ACCEPTED' : retry ? 'RETRY' : 'FAILED', providerId: result.providerId || null, lastError: accepted ? null : result.error || 'Envío no confirmado.', nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** (notice.attempts - 1))), leaseToken: null, leaseUntil: null } });
    }
  }
}
