import { CategoriesService } from './categories.service';
export declare class CreateCategoryDto {
    name: string;
    tenantId: string;
}
export declare class UpdateCategoryDto {
    name?: string;
}
export declare class CategoryResponseDto {
    id: string;
    name: string;
    productCount?: number;
}
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(tenantId?: string): Promise<CategoryResponseDto[]>;
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto>;
    remove(id: string): Promise<void>;
}
