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
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                price: number;
                name: string;
                sku: string | null;
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
            total: number;
            productName: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
            discount: number;
            productId: string;
            quoteId: string;
        })[];
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            email: string | null;
            phone: string | null;
        } | null;
    } & {
        number: string | null;
        id: string;
        subtotal: number;
        tax: number;
        total: number;
        status: import("@prisma/client").$Enums.QuoteStatus;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string | null;
        userId: string | null;
    }>;
    findAll(tenantId: string): Promise<({
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                price: number;
                name: string;
                sku: string | null;
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
            total: number;
            productName: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
            discount: number;
            productId: string;
            quoteId: string;
        })[];
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            email: string | null;
            phone: string | null;
        } | null;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string | null;
            email: string;
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            branchId: string | null;
        } | null;
    } & {
        number: string | null;
        id: string;
        subtotal: number;
        tax: number;
        total: number;
        status: import("@prisma/client").$Enums.QuoteStatus;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string | null;
        userId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                price: number;
                name: string;
                sku: string | null;
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
            total: number;
            productName: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
            discount: number;
            productId: string;
            quoteId: string;
        })[];
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            email: string | null;
            phone: string | null;
        } | null;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string | null;
            email: string;
            password: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            branchId: string | null;
        } | null;
    } & {
        number: string | null;
        id: string;
        subtotal: number;
        tax: number;
        total: number;
        status: import("@prisma/client").$Enums.QuoteStatus;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string | null;
        userId: string | null;
    }>;
    update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<{
        items: {
            id: string;
            total: number;
            productName: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            price: number;
            discount: number;
            productId: string;
            quoteId: string;
        }[];
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            rut: string;
            giro: string | null;
            address: string | null;
            comuna: string | null;
            email: string | null;
            phone: string | null;
        } | null;
    } & {
        number: string | null;
        id: string;
        subtotal: number;
        tax: number;
        total: number;
        status: import("@prisma/client").$Enums.QuoteStatus;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string | null;
        userId: string | null;
    }>;
    remove(id: string): Promise<{
        number: string | null;
        id: string;
        subtotal: number;
        tax: number;
        total: number;
        status: import("@prisma/client").$Enums.QuoteStatus;
        issueDate: Date;
        validUntil: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerId: string | null;
        userId: string | null;
    }>;
    convertToSale(id: string): Promise<any>;
    generatePdf(id: string): Promise<Buffer>;
}
