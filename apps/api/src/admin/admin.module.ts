import { ClientManagementController } from './client-management.controller';
import { ClientManagementService } from './client-management.service';
import { ClientDeletionService } from './client-deletion.service';
import { ClientFilesService } from './client-files.service';
import { BranchesModule } from '../branches/branches.module';
import { ModulesModule } from '../modules/modules.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantsModule } from '../tenants/tenants.module';
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuthModule, ConfigModule, EmailModule, BranchesModule, ModulesModule, NotificationsModule, TenantsModule],
  controllers: [AdminController, ClientManagementController],
  providers: [AdminService, PrismaService, ClientManagementService, ClientDeletionService, ClientFilesService],
})
export class AdminModule {}
