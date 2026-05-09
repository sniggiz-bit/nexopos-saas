import { ShopifyProduct, ShopifyOrder, ShopifyInventoryLevel, ShopifyLocation, ShopifyWebhook } from './shopify.types';
export declare class ShopifyClient {
    private readonly http;
    private readonly logger;
    private readonly apiVersion;
    constructor(shopDomain: string, accessToken: string);
    testConnection(): Promise<boolean>;
    createProduct(data: Partial<ShopifyProduct>): Promise<ShopifyProduct>;
    updateProduct(productId: string, data: Partial<ShopifyProduct>): Promise<ShopifyProduct>;
    getInventoryLevels(inventoryItemId: string, locationId: string): Promise<ShopifyInventoryLevel[]>;
    setInventoryLevel(locationId: string, inventoryItemId: string, available: number): Promise<void>;
    getOrders(since?: Date, status?: string): Promise<ShopifyOrder[]>;
    getLocations(): Promise<ShopifyLocation[]>;
    createWebhook(topic: string, address: string): Promise<ShopifyWebhook>;
    deleteWebhook(webhookId: string): Promise<void>;
    getWebhooks(): Promise<ShopifyWebhook[]>;
    private sleep;
}
