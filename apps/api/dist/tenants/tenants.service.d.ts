import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    createWithDefaults(data: {
        tenant: Prisma.TenantCreateInput;
        admin: Omit<Prisma.UserCreateInput, 'tenant' | 'branch'>;
    }): Promise<any>;
    findAll(search?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    updateSettings(tenantId: string, dto: UpdateTenantSettingsDto): Promise<any>;
    suspend(id: string): Promise<{
        name: string;
        id: string;
        slug: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        storeSlug: string | null;
        storeSettings: Prisma.JsonValue | null;
    }>;
    activate(id: string): Promise<{
        name: string;
        id: string;
        slug: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        storeSlug: string | null;
        storeSettings: Prisma.JsonValue | null;
    }>;
}
