import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(tenantId?: string, branchId?: string): Promise<ProductResponseDto[]>;
}
