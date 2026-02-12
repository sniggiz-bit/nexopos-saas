import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
import { CreditsService } from '../credits/credits.service';
interface GetSalesFilters {
    startDate?: string;
    endDate?: string;
    branchId?: string;
}
export declare class SalesService {
    private prisma;
    private dteService;
    private internalReceiptService;
    private creditsService;
    private readonly logger;
    constructor(prisma: PrismaService, dteService: DteService, internalReceiptService: InternalReceiptService, creditsService: CreditsService);
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
        customer: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            phone: string | null;
        } | null;
        credit: {
            id: string;
            tenantId: string;
            customerId: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            saleId: string | null;
            totalAmount: number;
            balance: number;
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
                unitType: import("@prisma/client/client").$Enums.UnitType;
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
        tenantId: string;
        branchId: string;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    })[]>;
    createSale(createSaleDto: CreateSaleDto): Promise<any>;
    completePreSale(id: string, payments: CreatePaymentDto[]): Promise<({
        customer: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            phone: string | null;
        } | null;
        credit: {
            id: string;
            tenantId: string;
            customerId: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            saleId: string | null;
            totalAmount: number;
            balance: number;
        } | null;
        items: {
            id: string;
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            saleId: string;
            amount: number;
            paymentMethod: import("@prisma/client/client").$Enums.PaymentMethod;
        }[];
    } & {
        id: string;
        total: number;
        tenantId: string;
        branchId: string;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    }) | null>;
    private emitDteAndReceipt;
}
export {};
