import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
import { CreditsService } from '../credits/credits.service';
import { InventoryService } from '../inventory/inventory.service';
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
    private inventoryService;
    private readonly logger;
    constructor(prisma: PrismaService, dteService: DteService, internalReceiptService: InternalReceiptService, creditsService: CreditsService, inventoryService: InventoryService);
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
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
        } | null;
        customer: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            rut: string;
            giro: string | null;
            address: string | null;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        } | null;
        credit: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            customerId: string;
            saleId: string | null;
            balance: number;
            totalAmount: number;
            dueDate: Date | null;
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
                unitType: import("@prisma/client").$Enums.UnitType;
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
        status: string;
        total: number;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
    })[]>;
    createSale(createSaleDto: CreateSaleDto): Promise<any>;
    completePreSale(id: string, payments: CreatePaymentDto[]): Promise<({
        customer: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            rut: string;
            giro: string | null;
            address: string | null;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        } | null;
        credit: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            customerId: string;
            saleId: string | null;
            balance: number;
            totalAmount: number;
            dueDate: Date | null;
        } | null;
        items: {
            id: string;
            price: number;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            amount: number;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            saleId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string;
        status: string;
        total: number;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
    }) | null>;
    private emitDteAndReceipt;
}
export {};
