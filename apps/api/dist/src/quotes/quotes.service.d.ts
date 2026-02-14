import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
export declare class QuotesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
            quoteId: string;
        })[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        total: number;
        customerId: string | null;
        expiryDate: Date | null;
    }>;
    findAll(tenantId: string): Promise<({
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
            quoteId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        total: number;
        customerId: string | null;
        expiryDate: Date | null;
    })[]>;
    findOne(id: string): Promise<{
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
            quoteId: string;
        })[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        total: number;
        customerId: string | null;
        expiryDate: Date | null;
    }>;
    update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        total: number;
        customerId: string | null;
        expiryDate: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        total: number;
        customerId: string | null;
        expiryDate: Date | null;
    }>;
    generatePdf(id: string): Promise<Buffer>;
}
