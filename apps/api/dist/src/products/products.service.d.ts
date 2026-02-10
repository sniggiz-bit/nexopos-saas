import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, branchId?: string): Promise<ProductResponseDto[]>;
}
