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
        items: ({
            product: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            transferId: string;
        })[];
        originBranch: {
            name: string;
            id: string;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            isMain: boolean;
            isActive: boolean;
            tenantId: string;
        };
        destinationBranch: {
            name: string;
            id: string;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            isMain: boolean;
            isActive: boolean;
            tenantId: string;
        };
        requestedBy: {
            name: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            branchId: string | null;
            email: string;
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        originBranchId: string;
        destBranchId: string;
        requestedById: string;
        processedById: string | null;
        note: string | null;
    })[]>;
}
