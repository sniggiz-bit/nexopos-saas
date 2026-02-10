import { PrismaService } from '../prisma/prisma.service';
interface CreateBrandDto {
    name: string;
    tenantId: string;
}
interface UpdateBrandDto {
    name?: string;
}
interface BrandResponseDto {
    id: string;
    name: string;
    productCount?: number;
}
export declare class BrandsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<BrandResponseDto[]>;
    create(createBrandDto: CreateBrandDto): Promise<BrandResponseDto>;
    update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandResponseDto>;
    remove(id: string): Promise<void>;
}
export {};
