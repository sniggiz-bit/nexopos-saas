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
    findAll(user: any): Promise<BrandResponseDto[]>;
    create(createBrandDto: CreateBrandDto, user: any): Promise<BrandResponseDto>;
    update(id: string, updateBrandDto: UpdateBrandDto, user: any): Promise<BrandResponseDto>;
    remove(id: string, user: any): Promise<void>;
}
