import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import {
  FEATURE_KEY,
  TenantFeatureFlag,
} from './decorators/require-feature.decorator';

/**
 * FeatureGuard — enforces that a tenant has a specific module/feature enabled.
 *
 * Reads the @RequireFeature('enableBoletaDte') metadata from the route handler,
 * then looks up the TenantSettings for the current user's tenant and checks
 * whether the flag is true.
 *
 * Prerequisites: JwtAuthGuard must run before this guard so that req.user
 * is populated with { tenantId, ... }.
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Read the required feature flag from route metadata
    const requiredFlag = this.reflector.getAllAndOverride<TenantFeatureFlag>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @RequireFeature() decorator, allow the request through
    if (!requiredFlag) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No tenant context found in request.');
    }

    // 2. Look up TenantSettings — use raw any cast because the client
    //    might be in a transitional state during migrations
    const settings = await (this.prisma as any).tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException(
        `TenantSettings not found for tenant ${tenantId}.`,
      );
    }

    // 3. Check the flag
    if (!settings[requiredFlag]) {
      throw new ForbiddenException(
        `El módulo '${requiredFlag}' no está habilitado en tu plan. Contacta al administrador.`,
      );
    }

    return true;
  }
}
