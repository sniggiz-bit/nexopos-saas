import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MODULES_KEY } from '../decorators/require-module.decorator';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<string[]>(REQUIRE_MODULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SuperAdmin role might bypass this, or maybe not. Let's assume SUPERADMIN has all access.
    if (user?.role === 'SUPERADMIN') {
      return true;
    }

    const userModules = user?.modules || [];

    // Check if user has ALL required modules for this route
    const hasAccess = requiredModules.every(mod => userModules.includes(mod));

    if (!hasAccess) {
      throw new ForbiddenException(`Access denied. Requires modules: ${requiredModules.join(', ')}`);
    }

    return true;
  }
}
