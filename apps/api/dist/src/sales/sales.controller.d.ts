import { SalesService } from './sales.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    findAll(startDate?: string, endDate?: string, branchId?: string): Promise<({
        branch: {
            name: string;
            id: string;
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
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        } | null;
        credit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerId: string;
            status: string;
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
                tenantId: string;
                sku: string | null;
                price: number;
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
            saleId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        total: number;
        branchId: string;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
        status: string;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    })[]>;
    create(createSaleDto: CreateSaleDto): Promise<any>;
    complete(id: string, payments: CreatePaymentDto[]): Promise<({
        customer: {
            name: string;
            id: string;
            rut: string;
            giro: string | null;
            address: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            comuna: string | null;
            phone: string | null;
        } | null;
        credit: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerId: string;
            status: string;
            saleId: string | null;
            totalAmount: number;
            balance: number;
            dueDate: Date | null;
        } | null;
        items: {
            id: string;
            price: number;
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
        tenantId: string;
        total: number;
        branchId: string;
        userId: string | null;
        cashShiftId: string | null;
        customerId: string | null;
        quoteId: string | null;
        status: string;
        dteFolio: number | null;
        dteStatus: string;
        dteType: number;
        dtePdfUrl: string | null;
        internalReceiptUrl: string | null;
    }) | null>;
}
