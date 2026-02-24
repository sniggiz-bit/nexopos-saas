import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by ResourceLimitGuard to read the resource limit to check.
 */
export const LIMIT_KEY = 'check_limit';

/**
 * Valid TenantSettings resource limit fields.
 */
export type TenantResourceLimit = 'maxBranches' | 'maxRegisters' | 'maxUsers';

/**
 * Marks a route as subject to a resource limit check.
 *
 * Usage: @CheckLimit('maxBranches')
 *
 * The ResourceLimitGuard will count existing records and throw 403 if the
 * tenant has reached their plan limit.
 */
export const CheckLimit = (resource: TenantResourceLimit) =>
  SetMetadata(LIMIT_KEY, resource);
