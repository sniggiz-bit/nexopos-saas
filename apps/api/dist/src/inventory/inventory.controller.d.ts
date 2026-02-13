import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getKardex(productId: string, branchId: string): Promise<({
        user: {
            name: string | null;
        } | null;
    } & {
        id: string;
        branchId: string;
        createdAt: Date;
        productId: string;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        userId: string | null;
        type: import("@prisma/client").$Enums.MovementType;
        reference: string | null;
        balance: import("@prisma/client-runtime-utils").Decimal;
    })[]>;
}
