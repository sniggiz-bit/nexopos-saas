import type { Response } from 'express';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
export declare class QuotesController {
    private readonly quotesService;
    constructor(quotesService: QuotesService);
    create(createQuoteDto: CreateQuoteDto): Promise<{
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
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        total: number;
        customerId: string | null;
        status: string;
        expiryDate: Date | null;
    }>;
    findAll(tenantId?: string): Promise<({
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
        items: {
            id: string;
            price: number;
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        total: number;
        customerId: string | null;
        status: string;
        expiryDate: Date | null;
    })[]>;
    findOne(id: string): Promise<{
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
            quoteId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        total: number;
        customerId: string | null;
        status: string;
        expiryDate: Date | null;
    }>;
    generatePdf(id: string, res: Response): Promise<void>;
    update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        total: number;
        customerId: string | null;
        status: string;
        expiryDate: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        total: number;
        customerId: string | null;
        status: string;
        expiryDate: Date | null;
    }>;
}
