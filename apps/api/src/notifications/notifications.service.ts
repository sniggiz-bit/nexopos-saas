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

  async notifySuperAdmin(title: string, message: string, type: 'CHAT' | 'REGISTRATION' | 'SYSTEM') {
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
    this.sendEmailNotification(title, message, type).catch(e => this.logger.error(e));

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

  private async sendEmailNotification(title: string, message: string, type: string) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) return;

    let actionUrl: string | undefined;
    if (type === 'CHAT') {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      actionUrl = `${frontendUrl}/admin/live-chats`;
    }

    await this.emailService.sendSystemNotification(adminEmail, title, message, type, actionUrl);
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
