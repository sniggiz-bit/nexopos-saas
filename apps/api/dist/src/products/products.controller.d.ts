import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findCritical(tenantId?: string, branchId?: string): Promise<{
        stock: number;
        inventory: {
            id: string;
            branchId: string;
            updatedAt: Date;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
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
        unitType: import("@prisma/client").$Enums.UnitType;
    }[]>;
    findAll(tenantId?: string, branchId?: string): Promise<ProductResponseDto[]>;
    findOne(id: string, tenantId?: string, branchId?: string): Promise<ProductResponseDto>;
    create(createProductDto: CreateProductDto): Promise<ProductResponseDto>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto>;
    remove(id: string): Promise<void>;
}
