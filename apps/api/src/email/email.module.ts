import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { WelcomeEmailsService } from './welcome-emails.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, WelcomeEmailsService],
  exports: [EmailService, WelcomeEmailsService],
})
export class EmailModule {}
