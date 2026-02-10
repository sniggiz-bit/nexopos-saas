import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, branchId?: string): Promise<ProductResponseDto[]>;
    findOne(id: string, tenantId: string, branchId?: string): Promise<ProductResponseDto>;
    create(createProductDto: CreateProductDto): Promise<ProductResponseDto>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto>;
    remove(id: string): Promise<void>;
}
