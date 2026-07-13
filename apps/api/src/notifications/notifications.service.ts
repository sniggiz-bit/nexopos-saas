import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private configService: ConfigService,
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
    await this.sendWebhook(title, message, type);

    return notification;
  }

  private async sendWebhook(title: string, message: string, type: string) {
    const webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL') || this.configService.get<string>('SLACK_WEBHOOK_URL');
    
    if (!webhookUrl) {
      return; // No webhook configured
    }

    try {
      // Very basic payload format that works for Discord and Slack
      const payload = {
        content: `**[${type}] ${title}**\n${message}`
      };

      await axios.post(webhookUrl, payload);
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
    }
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
