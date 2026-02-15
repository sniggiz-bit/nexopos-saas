import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SalesService } from '../sales/sales.service';
export declare class QuotesService {
    private readonly prisma;
    private readonly salesService;
    constructor(prisma: PrismaService, salesService: SalesService);
    private calculateTotals;
    private generateQuoteNumber;
    create(createQuoteDto: CreateQuoteDto): Promise<{
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
            total: number;
            quoteId: string;
            productName: string | null;
            discount: number;
        })[];
    } & {
        number: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        total: number;
        userId: string | null;
        customerId: string | null;
        subtotal: number;
        tax: number;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
    }>;
    findAll(tenantId: string): Promise<({
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
        items: {
            id: string;
            price: number;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: number;
            quoteId: string;
            productName: string | null;
            discount: number;
        }[];
    } & {
        number: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        total: number;
        userId: string | null;
        customerId: string | null;
        subtotal: number;
        tax: number;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
    })[]>;
    findOne(id: string): Promise<{
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
            total: number;
            quoteId: string;
            productName: string | null;
            discount: number;
        })[];
    } & {
        number: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        total: number;
        userId: string | null;
        customerId: string | null;
        subtotal: number;
        tax: number;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
    }>;
    update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<{
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
        items: {
            id: string;
            price: number;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: number;
            quoteId: string;
            productName: string | null;
            discount: number;
        }[];
    } & {
        number: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        total: number;
        userId: string | null;
        customerId: string | null;
        subtotal: number;
        tax: number;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
    }>;
    remove(id: string): Promise<{
        number: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        total: number;
        userId: string | null;
        customerId: string | null;
        subtotal: number;
        tax: number;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
    }>;
    convertToSale(id: string): Promise<any>;
    generatePdf(id: string): Promise<Buffer>;
}
