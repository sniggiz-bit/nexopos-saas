import { TransfersService } from './transfers.service';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    create(createTransferDto: {
        originBranchId: string;
        destBranchId: string;
        items: any[];
        note?: string;
    }, req: any): Promise<any>;
    findAll(req: any): Promise<({
        originBranch: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            address: string | null;
            isMain: boolean;
            isActive: boolean;
            tenantId: string;
        };
        destinationBranch: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            address: string | null;
            isMain: boolean;
            isActive: boolean;
            tenantId: string;
        };
        requestedBy: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            tenantId: string;
            email: string;
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            branchId: string | null;
        };
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                tenantId: string;
                sku: string | null;
                price: number;
                barcode: string | null;
                brandId: string | null;
                categoryId: string | null;
                costPrice: number;
                image: string | null;
                description: string | null;
                isPublic: boolean;
                minStock: number;
                stock: number | null;
                unitType: import("@prisma/client").$Enums.UnitType;
            };
        } & {
            id: string;
            transferId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        })[];
    } & {
        id: string;
        originBranchId: string;
        destBranchId: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        requestedById: string;
        processedById: string | null;
        createdAt: Date;
        updatedAt: Date;
        note: string | null;
    })[]>;
}
