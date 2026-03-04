import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<ProductResponseDto[]>;
    findOne(id: string, tenantId: string): Promise<ProductResponseDto>;
    create(createProductDto: CreateProductDto): Promise<ProductResponseDto>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto>;
    remove(id: string): Promise<void>;
    findCritical(tenantId: string, branchId?: string): Promise<{
        stock: number;
        brand: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
        } | null;
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
        } | null;
        inventory: {
            id: string;
            updatedAt: Date;
            minStock: number;
            branchId: string;
            productId: string;
            quantity: Prisma.Decimal;
        }[];
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
        unitType: import("@prisma/client").$Enums.UnitType;
    }[]>;
    bulkUpdatePublicStatus(tenantId: string, ids: string[], isPublic: boolean): Promise<Prisma.BatchPayload>;
}
