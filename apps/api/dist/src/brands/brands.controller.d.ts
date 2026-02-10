import { BrandsService } from './brands.service';
export declare class CreateBrandDto {
    name: string;
    tenantId: string;
}
export declare class UpdateBrandDto {
    name?: string;
}
export declare class BrandResponseDto {
    id: string;
    name: string;
    productCount?: number;
}
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    findAll(tenantId?: string): Promise<BrandResponseDto[]>;
    create(createBrandDto: CreateBrandDto): Promise<BrandResponseDto>;
    update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandResponseDto>;
    remove(id: string): Promise<void>;
}
