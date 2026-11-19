import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupportService } from './support.service';
import { SupportKnowledgeService } from './support-knowledge.service';
import { GeminiSupportService } from './gemini-support.service';
import { SupportNoticeWorker } from './support-notice.worker';
@Module({ imports: [PrismaModule, NotificationsModule], controllers: [SupportController], providers: [SupportService, SupportKnowledgeService, GeminiSupportService, SupportNoticeWorker] })
export class SupportModule {}
