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
            branchId: string | null;
            id: string;
            tenantId: string;
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
        branchId: string;
        id: string;
        total: number;
        tenantId: string;
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
    create(createSaleDto: CreateSaleDto): Promise<any>;
    complete(id: string, payments: CreatePaymentDto[]): Promise<({
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
        branchId: string;
        id: string;
        total: number;
        tenantId: string;
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
}
