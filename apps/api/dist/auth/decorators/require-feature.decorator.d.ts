export declare const FEATURE_KEY = "require_feature";
export type TenantFeatureFlag = 'enableBoletaDte' | 'enableFacturaDte' | 'enableGuiaDespachoDte' | 'enableNotaCreditoDte' | 'canHardDelete';
export declare const RequireFeature: (flag: TenantFeatureFlag) => import("@nestjs/common").CustomDecorator<string>;
