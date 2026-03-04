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
            total: number;
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            productName: string | null;
            discount: number;
        })[];
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
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
        items: {
            id: string;
            price: number;
            total: number;
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            productName: string | null;
            discount: number;
        }[];
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
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
            total: number;
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            productName: string | null;
            discount: number;
        })[];
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
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
        items: {
            id: string;
            price: number;
            total: number;
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            productName: string | null;
            discount: number;
        }[];
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
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
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
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
