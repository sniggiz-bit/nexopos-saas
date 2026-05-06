import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getKardex(productId: string, branchId?: string): Promise<({
        user: {
            name: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        branchId: string;
        userId: string | null;
        balance: import("@prisma/client-runtime-utils").Decimal;
        productId: string;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        type: import("@prisma/client").$Enums.MovementType;
        reference: string | null;
    })[]>;
    adjustStock(body: any, req: any): Promise<{
        newBalance: number;
    }>;
}
