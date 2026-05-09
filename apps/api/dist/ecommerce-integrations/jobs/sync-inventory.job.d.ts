import { InventorySyncService } from '../services/inventory-sync.service';
export declare class SyncInventoryJob {
    private readonly inventorySyncService;
    private readonly logger;
    constructor(inventorySyncService: InventorySyncService);
    run(): Promise<void>;
}
