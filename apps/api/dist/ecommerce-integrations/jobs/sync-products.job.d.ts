import { ProductSyncService } from '../services/product-sync.service';
export declare class SyncProductsJob {
    private readonly productSyncService;
    private readonly logger;
    constructor(productSyncService: ProductSyncService);
    run(): Promise<void>;
}
