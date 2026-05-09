import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';
export declare class OrderSyncService {
    private readonly prisma;
    private readonly integrationService;
    private readonly logger;
    constructor(prisma: PrismaService, integrationService: IntegrationService);
    pullOrders(connectionId: string): Promise<void>;
    processOrder(ecommerceOrderId: string): Promise<{
        saleId?: string;
        message: string;
    }>;
    pullAllActiveConnections(): Promise<void>;
}
