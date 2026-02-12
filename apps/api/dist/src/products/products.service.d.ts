import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, branchId?: string): Promise<ProductResponseDto[]>;
    findOne(id: string, tenantId: string, branchId?: string): Promise<ProductResponseDto>;
    create(createProductDto: CreateProductDto): Promise<ProductResponseDto>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto>;
    remove(id: string): Promise<void>;
    findCritical(tenantId: string, branchId?: string): Promise<{
        stock: number;
        inventory: {
            id: string;
            updatedAt: Date;
            productId: string;
            branchId: string;
            quantity: Prisma.Decimal;
        }[];
        brand: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        category: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        id: string;
        name: string;
        sku: string | null;
        price: number;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        barcode: string | null;
        brandId: string | null;
        categoryId: string | null;
        costPrice: number;
        image: string | null;
        isActive: boolean;
        minStock: number;
        unitType: import("@prisma/client").$Enums.UnitType;
    }[]>;
}
