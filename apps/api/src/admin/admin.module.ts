import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [AuthModule, ConfigModule],
    controllers: [AdminController],
    providers: [AdminService, PrismaService],
})
export class AdminModule { }
