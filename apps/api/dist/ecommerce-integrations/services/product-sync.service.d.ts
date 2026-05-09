import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';
export declare class ProductSyncService {
    private readonly prisma;
    private readonly integrationService;
    private readonly logger;
    constructor(prisma: PrismaService, integrationService: IntegrationService);
    syncProducts(connectionId: string): Promise<void>;
    syncAllActiveConnections(): Promise<void>;
}
