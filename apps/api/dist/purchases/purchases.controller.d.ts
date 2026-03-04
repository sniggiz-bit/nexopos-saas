import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    private getTenantId;
    findAll(req: any, branchId?: string): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(body: {
        supplierId?: string;
        branchId: string;
        notes?: string;
        items: {
            productId: string;
            quantity: number;
            costPrice: number;
        }[];
    }, req: any): Promise<any>;
}
