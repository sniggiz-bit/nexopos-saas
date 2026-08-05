import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { BillingStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow routes marked with @Public() to skip JWT verification
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch (_error) {
      throw new UnauthorizedException();
    }

    // --- Tenant Status & Billing Check ---
    if (payload?.tenantId && payload?.role !== 'SUPER_ADMIN') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { status: true, billingStatus: true }
      });

      // Block access entirely if tenant is SUSPENDED
      if (tenant?.status === 'SUSPENDED') {
        throw new HttpException(
          'Tu cuenta ha sido suspendida. Contacta al administrador.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (tenant?.billingStatus === BillingStatus.PAST_DUE) {
        const url = request.url;
        // Only allow login/logout, modules API, and maybe billing APIs
        const allowedPaths = ['/auth', '/modules'];
        const isAllowedPath = allowedPaths.some(p => url.startsWith(p));
        
        if (!isAllowedPath) {
          throw new HttpException('Tenant subscription is PAST_DUE. Payment required.', HttpStatus.PAYMENT_REQUIRED);
        }
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
