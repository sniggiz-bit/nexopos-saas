import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    findAll(startDate?: string, endDate?: string, branchId?: string): Promise<({
        branch: {
            id: string;
            tenantId: string;
            name: string;
        };
        user: {
            id: string;
            tenantId: string;
            branchId: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            email: string;
        } | null;
        items: ({
            product: {
                id: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: number;
                sku: string | null;
                barcode: string | null;
                brandId: string | null;
                categoryId: string | null;
                costPrice: number;
                image: string | null;
                isActive: boolean;
                minStock: number;
                unitType: import("@prisma/client").$Enums.UnitType;
            };
        } & {
            id: string;
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
        })[];
    } & {
        id: string;
        total: number;
        paymentMethod: string;
        tenantId: string;
        branchId: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    })[]>;
    create(createSaleDto: CreateSaleDto): Promise<({
        branch: {
            id: string;
            tenantId: string;
            name: string;
        };
        user: {
            id: string;
            tenantId: string;
            branchId: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            email: string;
        } | null;
        items: ({
            product: {
                id: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: number;
                sku: string | null;
                barcode: string | null;
                brandId: string | null;
                categoryId: string | null;
                costPrice: number;
                image: string | null;
                isActive: boolean;
                minStock: number;
                unitType: import("@prisma/client").$Enums.UnitType;
            };
        } & {
            id: string;
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
        })[];
    } & {
        id: string;
        total: number;
        paymentMethod: string;
        tenantId: string;
        branchId: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    }) | null>;
}
