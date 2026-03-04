import { PrismaService } from '../prisma/prisma.service';
export declare class StoreService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slug: string): Promise<{
        mainBranchId: string;
        name: string;
        id: string;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue;
        branches: {
            id: string;
        }[];
    }>;
    findProductsBySlug(slug: string, search?: string): Promise<{
        name: string;
        id: string;
        category: {
            name: string;
        } | null;
        price: number;
        image: string | null;
        description: string | null;
    }[]>;
    updateStoreSettings(tenantId: string, settings: any): Promise<{
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
        storeSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    getSettings(tenantId: string): Promise<{
        id: string;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
