import { SalesService } from './sales.service';
import { CreateSaleDto, CreatePaymentDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    findAll(startDate?: string, endDate?: string, branchId?: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string | null;
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            tenantId: string;
            branchId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        branch: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            isMain: boolean;
        };
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
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
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                sku: string | null;
                price: number;
                barcode: string | null;
                brandId: string | null;
                categoryId: string | null;
                costPrice: number;
                image: string | null;
                description: string | null;
                isPublic: boolean;
                isActive: boolean;
                minStock: number;
                stock: number | null;
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
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
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
    create(createSaleDto: CreateSaleDto): Promise<any>;
    complete(id: string, payments: CreatePaymentDto[]): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
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
        branchId: string;
        createdAt: Date;
        updatedAt: Date;
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
}
