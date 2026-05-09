import { EcommerceDriverInterface, ExternalOrder, InventorySyncPayload, SyncProductPayload, SyncResult, WebhookRegistrationResult } from '../../interfaces/ecommerce-driver.interface';
export declare class WooCommerceDriver implements EcommerceDriverInterface {
    private readonly client;
    private readonly logger;
    private readonly webhookSecret;
    constructor(siteUrl: string, consumerKey: string, consumerSecret: string, webhookSecret?: string);
    testConnection(): Promise<boolean>;
    pushProduct(payload: SyncProductPayload): Promise<SyncResult>;
    updateProduct(externalId: string, payload: Partial<SyncProductPayload>): Promise<SyncResult>;
    setInventoryLevel(payload: InventorySyncPayload): Promise<SyncResult>;
    pullOrders(since?: Date): Promise<ExternalOrder[]>;
    registerWebhooks(baseUrl: string, connectionId: string): Promise<WebhookRegistrationResult[]>;
    unregisterWebhook(externalWebhookId: string): Promise<void>;
}
