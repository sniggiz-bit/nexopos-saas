import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SupportController],
})
export class SupportModule {}
