import { OrderSyncService } from '../services/order-sync.service';
export declare class PullOrdersJob {
    private readonly orderSyncService;
    private readonly logger;
    constructor(orderSyncService: OrderSyncService);
    run(): Promise<void>;
}
