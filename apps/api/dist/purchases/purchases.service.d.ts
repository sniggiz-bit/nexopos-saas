import { PrismaService } from '../prisma/prisma.service';
interface PurchaseItemDto {
    productId: string;
    quantity: number;
    costPrice: number;
}
interface CreatePurchaseDto {
    supplierId?: string;
    branchId: string;
    notes?: string;
    items: PurchaseItemDto[];
}
export declare class PurchasesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, branchId?: string): Promise<({
        branch: {
            name: string;
            id: string;
        };
        supplier: {
            name: string;
            id: string;
        } | null;
        _count: {
            items: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseStatus;
        tenantId: string;
        branchId: string;
        notes: string | null;
        totalAmount: number;
        date: Date;
        supplierId: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        branch: {
            name: string;
            id: string;
        };
        supplier: {
            name: string;
            id: string;
            rut: string | null;
        } | null;
        items: ({
            product: {
                name: string;
                id: string;
                sku: string | null;
            };
        } & {
            id: string;
            costPrice: number;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            purchaseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PurchaseStatus;
        tenantId: string;
        branchId: string;
        notes: string | null;
        totalAmount: number;
        date: Date;
        supplierId: string | null;
    }>;
    create(data: CreatePurchaseDto, tenantId: string): Promise<any>;
}
export {};
