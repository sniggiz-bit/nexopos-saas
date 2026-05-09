import { EcommerceDriverInterface, ExternalOrder, InventorySyncPayload, SyncProductPayload, SyncResult, WebhookRegistrationResult } from '../../interfaces/ecommerce-driver.interface';
export declare class ShopifyDriver implements EcommerceDriverInterface {
    private readonly client;
    private readonly logger;
    private readonly locationId;
    constructor(shopDomain: string, accessToken: string, locationId?: string);
    testConnection(): Promise<boolean>;
    pushProduct(payload: SyncProductPayload): Promise<SyncResult>;
    updateProduct(externalId: string, payload: Partial<SyncProductPayload>): Promise<SyncResult>;
    setInventoryLevel(payload: InventorySyncPayload): Promise<SyncResult>;
    pullOrders(since?: Date): Promise<ExternalOrder[]>;
    registerWebhooks(baseUrl: string, connectionId: string): Promise<WebhookRegistrationResult[]>;
    unregisterWebhook(externalWebhookId: string): Promise<void>;
    getLocations(): Promise<{
        id: string;
        name: string;
    }[]>;
}
