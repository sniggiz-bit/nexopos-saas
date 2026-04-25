export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    BRANCH_ADMIN = 'BRANCH_ADMIN',
    CASHIER = 'CASHIER',
}

export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
}

export type MovementType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INITIAL';
