import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';
export declare class InventorySyncService {
    private readonly prisma;
    private readonly integrationService;
    private readonly logger;
    constructor(prisma: PrismaService, integrationService: IntegrationService);
    syncInventory(connectionId: string): Promise<void>;
    syncAllActiveConnections(): Promise<void>;
    pushStockForProduct(nexoposProductId: string): Promise<void>;
}
