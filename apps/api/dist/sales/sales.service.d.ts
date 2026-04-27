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
    tenantId?: string;
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
            name: string;
            id: string;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            isMain: boolean;
            isActive: boolean;
            tenantId: string;
        };
        user: {
            name: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            branchId: string | null;
            email: string;
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
        } | null;
        customer: {
            name: string;
            id: string;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
        } | null;
        credit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            tenantId: string;
            customerId: string;
            saleId: string | null;
            totalAmount: number;
            balance: number;
            dueDate: Date | null;
        } | null;
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
            price: number;
            discountAmount: number;
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string;
        total: number;
        discountAmount: number;
        branchId: string;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    })[]>;
    createSale(createSaleDto: CreateSaleDto): Promise<any>;
    completePreSale(id: string, payments: CreatePaymentDto[]): Promise<({
        customer: {
            name: string;
            id: string;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
        } | null;
        credit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            tenantId: string;
            customerId: string;
            saleId: string | null;
            totalAmount: number;
            balance: number;
            dueDate: Date | null;
        } | null;
        items: {
            id: string;
            price: number;
            discountAmount: number;
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            saleId: string;
            amount: number;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string;
        total: number;
        discountAmount: number;
        branchId: string;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    }) | null>;
    private emitDteAndReceipt;
}
export {};
