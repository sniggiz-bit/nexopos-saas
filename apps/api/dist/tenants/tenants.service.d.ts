import { PrismaService } from '../prisma/prisma.service';
import { Tenant } from '@prisma/client';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(search?: string): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant | null>;
    updateLimits(id: string, limits: {
        maxUsers?: number;
        maxProducts?: number;
    }): Promise<{
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
        maxUsers: number | null;
        maxProducts: number | null;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
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
        maxUsers: number | null;
        maxProducts: number | null;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
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
        maxUsers: number | null;
        maxProducts: number | null;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
