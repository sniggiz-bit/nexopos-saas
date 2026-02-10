import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreateSaleDto } from './dto/create-sale.dto';
interface GetSalesFilters {
    startDate?: string;
    endDate?: string;
    branchId?: string;
}
export declare class SalesService {
    private prisma;
    private dteService;
    private internalReceiptService;
    private readonly logger;
    constructor(prisma: PrismaService, dteService: DteService, internalReceiptService: InternalReceiptService);
    getSales(filters?: GetSalesFilters): Promise<({
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
    createSale(createSaleDto: CreateSaleDto): Promise<({
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
export {};
