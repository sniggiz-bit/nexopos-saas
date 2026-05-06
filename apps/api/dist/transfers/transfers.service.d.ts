import { PrismaService } from '../prisma/prisma.service';
interface CreateTransferItemDto {
    productId: string;
    quantity: number;
}
interface CreateTransferDto {
    originBranchId: string;
    destBranchId: string;
    items: CreateTransferItemDto[];
    note?: string;
    userId: string;
}
export declare class TransfersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateTransferDto): Promise<any>;
    findAll(tenantId: string): Promise<({
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
            transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
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
            transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
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
export {};
