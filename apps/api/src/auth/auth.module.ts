import { Module, Global, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { FeatureGuard } from './feature.guard';
import { ResourceLimitGuard } from './resource-limit.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    PrismaModule,
    EmailModule,
    forwardRef(() => TenantsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey', // Fallback for dev
        signOptions: { expiresIn: '1d' }, // 1 day expiration
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FeatureGuard, ResourceLimitGuard, JwtAuthGuard],
  exports: [AuthService, JwtModule, FeatureGuard, ResourceLimitGuard, JwtAuthGuard],
})
export class AuthModule {}
