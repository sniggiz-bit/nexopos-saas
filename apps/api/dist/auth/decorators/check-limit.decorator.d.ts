export declare const LIMIT_KEY = "check_limit";
export type TenantResourceLimit = 'maxBranches' | 'maxRegisters' | 'maxUsers';
export declare const CheckLimit: (resource: TenantResourceLimit) => import("@nestjs/common").CustomDecorator<string>;
