import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async notifySuperAdmin(title: string, message: string, type: 'CHAT' | 'REGISTRATION' | 'SYSTEM', options: { actionPath?: string } = {}) {
    // 1. Save to DB
    const notification = await this.prisma.systemNotification.create({
      data: {
        title,
        message,
        type,
      },
    });

    // 2. Emit via WebSockets to superadmin room
    this.eventsGateway.emitToTenant('superadmin', 'new_notification', notification);

    // 3. Send Webhook if configured
    this.sendWebhook(title, message, type).catch(e => this.logger.error(e));

    // 4. Send Email if configured
    this.sendEmailNotification(notification.id, title, message, type, options.actionPath).catch(() => this.logger.error('Could not process admin email notification.'));

    return notification;
  }

  private async sendWebhook(title: string, message: string, type: string) {
    const webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL') || this.configService.get<string>('SLACK_WEBHOOK_URL');
    
    if (!webhookUrl) {
      return; // No webhook configured
    }

    try {
      // Payload format that works for both Discord (content) and Slack (text)
      const payload = {
        content: `**[${type}] ${title}**\n${message}`,
        text: `*[${type}] ${title}*\n${message}`
      };

      await axios.post(webhookUrl, payload);
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
    }
  }

  async sendEmailNotification(notificationId: string, title: string, message: string, type: string, actionPath?: string, idempotencyKey?: string) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL')?.trim() || 'sniggiz@gmail.com';
    const frontend = new URL(this.configService.get<string>('FRONTEND_URL') || 'https://nexopos.cl');
    if (!['https:', 'http:'].includes(frontend.protocol) || frontend.username || frontend.password ||
        (process.env.NODE_ENV === 'production' && (frontend.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(frontend.hostname)))) {
      throw new Error('Invalid frontend URL for admin notification');
    }
    const path = actionPath || (type === 'CHAT' ? '/admin/live-chats' : type === 'REGISTRATION' ? '/admin/tenants' : undefined);
    if (path && (!path.startsWith('/admin/') || path.includes('\\') || /[\r\n]/.test(path))) throw new Error('Invalid admin action path');
    const result = await this.emailService.sendSystemNotification(adminEmail, title, message, type, path ? frontend.origin + path : undefined, idempotencyKey);
    await this.prisma.systemLog.create({ data: {
      level: result.status === 'ACCEPTED' ? 'INFO' : 'WARNING',
      message: 'ADMIN_EMAIL_NOTIFICATION',
      context: { notificationId, type, ...result },
    } });
    return result;
  }

  async getHistory(limit = 50) {
    return this.prisma.systemNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount() {
    return this.prisma.systemNotification.count({
      where: { isRead: false },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.systemNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead() {
    return this.prisma.systemNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }
}
