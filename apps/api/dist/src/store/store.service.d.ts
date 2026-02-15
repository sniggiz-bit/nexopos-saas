import { PrismaService } from '../prisma/prisma.service';
export declare class StoreService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slug: string): Promise<{
        mainBranchId: string;
        id: string;
        name: string;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue;
        branches: {
            id: string;
        }[];
    }>;
    findProductsBySlug(slug: string, search?: string): Promise<{
        id: string;
        name: string;
        price: number;
        image: string | null;
        description: string | null;
        category: {
            name: string;
        } | null;
    }[]>;
    updateStoreSettings(tenantId: string, settings: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        phone: string | null;
        rut: string | null;
        giro: string | null;
        address: string | null;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getSettings(tenantId: string): Promise<{
        id: string;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
