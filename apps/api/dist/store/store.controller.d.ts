import { StoreService } from './store.service';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    getSettings(req: any): Promise<{
        id: string;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue;
    }>;
    updateSettings(body: any, req: any): Promise<{
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
    getStore(slug: string): Promise<{
        mainBranchId: string;
        name: string;
        id: string;
        storeSlug: string | null;
        storeSettings: import("@prisma/client/runtime/client").JsonValue;
        branches: {
            id: string;
        }[];
    }>;
    getProducts(slug: string, search?: string): Promise<{
        name: string;
        id: string;
        category: {
            name: string;
        } | null;
        price: number;
        image: string | null;
        description: string | null;
    }[]>;
}
