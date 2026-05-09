import { WooOrder, WooProduct, WooWebhook } from './woocommerce.types';
export declare class WooCommerceClient {
    private readonly http;
    private readonly logger;
    constructor(siteUrl: string, consumerKey: string, consumerSecret: string);
    testConnection(): Promise<boolean>;
    createProduct(data: Partial<WooProduct>): Promise<WooProduct>;
    updateProduct(productId: string, data: Partial<WooProduct>): Promise<WooProduct>;
    getOrders(since?: Date, page?: number): Promise<WooOrder[]>;
    createWebhook(topic: string, deliveryUrl: string, secret: string): Promise<WooWebhook>;
    deleteWebhook(webhookId: string): Promise<void>;
    getWebhooks(): Promise<WooWebhook[]>;
}
