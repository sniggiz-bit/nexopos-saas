import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { BillingStatus } from '@prisma/client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwtService: JwtService;

  constructor(private prisma: PrismaService) {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException();
    }

    // --- Billing Check ---
    if (payload?.tenantId && payload?.role !== 'SUPER_ADMIN') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { billingStatus: true }
      });

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
