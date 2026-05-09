import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from './integration.service';
import { OrderSyncService } from './order-sync.service';
import { InventorySyncService } from './inventory-sync.service';
export declare class WebhookService {
    private readonly prisma;
    private readonly integrationService;
    private readonly orderSyncService;
    private readonly inventorySyncService;
    private readonly logger;
    constructor(prisma: PrismaService, integrationService: IntegrationService, orderSyncService: OrderSyncService, inventorySyncService: InventorySyncService);
    validateShopifyHmac(rawBody: Buffer, hmacHeader: string, secret: string): void;
    validateWooCommerceSignature(rawBody: Buffer, signatureHeader: string, secret: string): void;
    handleShopifyWebhook(connectionId: string, topic: string, rawBody: Buffer, hmacHeader: string, payload: any): Promise<void>;
    handleWooCommerceWebhook(connectionId: string, topic: string, rawBody: Buffer, signatureHeader: string, payload: any): Promise<void>;
    registerWebhooksForConnection(connectionId: string, baseUrl: string): Promise<void>;
    private dispatchShopifyEvent;
    private dispatchWooCommerceEvent;
}
