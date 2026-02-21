import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    name?: string;
    password?: string;
    role?: UserRole;
    tenantId: string;
    branchId?: string;
}
