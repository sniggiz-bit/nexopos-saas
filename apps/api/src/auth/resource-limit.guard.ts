import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import {
  LIMIT_KEY,
  TenantResourceLimit,
} from './decorators/check-limit.decorator';

/**
 * Maps a TenantSettings limit field to the Prisma delegate name and the
 * tenantId filter field.
 */
const RESOURCE_MAP: Record<
  TenantResourceLimit,
  { model: string; field: string }
> = {
  maxBranches: { model: 'branch', field: 'tenantId' },
  maxRegisters: { model: 'register', field: 'tenantId' },
  maxUsers: { model: 'user', field: 'tenantId' },
};

/**
 * ResourceLimitGuard — prevents creation of new resources when the tenant has
 * reached the limit defined in their TenantSettings.
 *
 * Reads @CheckLimit('maxBranches') from the route handler, counts existing
 * records for the tenant, and throws 403 if count >= limit.
 *
 * Prerequisites: JwtAuthGuard must run before this guard.
 */
@Injectable()
export class ResourceLimitGuard implements CanActivate {
  private readonly logger = new Logger(ResourceLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Read the resource limit key from route metadata
    const limitKey = this.reflector.getAllAndOverride<TenantResourceLimit>(
      LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @CheckLimit() decorator — let the request through
    if (!limitKey) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('No tenant context found in request.');
    }

    // 2. Load TenantSettings
    const settings = await (this.prisma as any).tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException(
        `TenantSettings not found for tenant ${tenantId}.`,
      );
    }

    const limit: number = settings[limitKey];

    // 3. Look up the Prisma model delegate and count existing records
    const resource = RESOURCE_MAP[limitKey];
    if (!resource) {
      // Unknown limit key — fail safe: allow
      return true;
    }

    const prismaDelegate = (this.prisma as any)[resource.model];
    if (!prismaDelegate) {
      this.logger.warn(
        `Resource model '${resource.model}' does not exist on PrismaService. Fail-safe active, letting request pass.`,
      );
      return true;
    }

    const currentCount: number = await prismaDelegate.count({
      where: { [resource.field]: tenantId },
    });

    // 4. Enforce the limit (>= means "at or above the cap", block creation)
    if (currentCount >= limit) {
      throw new ForbiddenException(
        `Has alcanzado el límite de tu plan (${currentCount}/${limit} ${limitKey.replace('max', '')}). ` +
          `Actualiza tu plan para agregar más.`,
      );
    }

    return true;
  }
}
