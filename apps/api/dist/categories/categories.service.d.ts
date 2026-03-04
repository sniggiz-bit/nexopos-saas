import { PrismaService } from '../prisma/prisma.service';
interface CreateCategoryDto {
    name: string;
    tenantId: string;
}
interface UpdateCategoryDto {
    name?: string;
}
interface CategoryResponseDto {
    id: string;
    name: string;
    productCount?: number;
}
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<CategoryResponseDto[]>;
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto>;
    update(id: string, tenantId: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto>;
    remove(id: string, tenantId: string): Promise<void>;
}
export {};
