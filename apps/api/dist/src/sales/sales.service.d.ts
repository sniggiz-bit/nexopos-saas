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
            name: string;
            tenantId: string;
        };
        user: {
            id: string;
            name: string | null;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            branchId: string | null;
            email: string;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                sku: string | null;
                price: number;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                barcode: string | null;
                brandId: string | null;
                categoryId: string | null;
                costPrice: number;
                image: string | null;
                isActive: boolean;
                minStock: number;
                unitType: import("@prisma/client/client").$Enums.UnitType;
            };
        } & {
            id: string;
            price: number;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        })[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        total: number;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
        userId: string | null;
        cashShiftId: string | null;
    })[]>;
    createSale(createSaleDto: CreateSaleDto): Promise<({
        branch: {
            id: string;
            name: string;
            tenantId: string;
        };
        user: {
            id: string;
            name: string | null;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            branchId: string | null;
            email: string;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                sku: string | null;
                price: number;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                barcode: string | null;
                brandId: string | null;
                categoryId: string | null;
                costPrice: number;
                image: string | null;
                isActive: boolean;
                minStock: number;
                unitType: import("@prisma/client/client").$Enums.UnitType;
            };
        } & {
            id: string;
            price: number;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            amount: number;
            paymentMethod: import("@prisma/client/client").$Enums.PaymentMethod;
            saleId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        total: number;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
        userId: string | null;
        cashShiftId: string | null;
    }) | null>;
}
export {};
