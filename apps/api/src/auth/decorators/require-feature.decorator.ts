import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by FeatureGuard to read the required feature flag.
 */
export const FEATURE_KEY = 'require_feature';

/**
 * Valid TenantSettings feature flag fields.
 */
export type TenantFeatureFlag =
  | 'enableBoletaDte'
  | 'enableFacturaDte'
  | 'enableGuiaDespachoDte'
  | 'enableNotaCreditoDte'
  | 'canHardDelete';

/**
 * Marks a route as requiring a specific DTE module or feature to be enabled
 * for the tenant.
 *
 * Usage: @RequireFeature('enableBoletaDte')
 *
 * The FeatureGuard will throw 403 Forbidden if the tenant's setting is false.
 */
export const RequireFeature = (flag: TenantFeatureFlag) =>
  SetMetadata(FEATURE_KEY, flag);
