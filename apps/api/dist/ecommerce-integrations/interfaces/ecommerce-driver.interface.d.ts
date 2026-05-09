export interface ExternalProduct {
    externalId: string;
    externalVariantId?: string;
    name: string;
    sku?: string;
    price: number;
    stock: number;
    imageUrl?: string;
    description?: string;
}
export interface ExternalOrderItem {
    externalProductId: string;
    productName: string;
    quantity: number;
    price: number;
}
export interface ExternalCustomer {
    email?: string;
    name: string;
    phone?: string;
    address?: string;
}
export interface ExternalOrder {
    externalId: string;
    externalNumber?: string;
    status: string;
    customer?: ExternalCustomer;
    items: ExternalOrderItem[];
    total: number;
    currency: string;
    createdAt: string;
    rawData: Record<string, any>;
}
export interface SyncProductPayload {
    nexoposProductId: string;
    name: string;
    sku?: string;
    price: number;
    stock: number;
    imageUrl?: string;
    description?: string;
}
export interface SyncResult {
    success: boolean;
    externalId?: string;
    externalVariantId?: string;
    error?: string;
}
export interface InventorySyncPayload {
    externalId: string;
    externalVariantId?: string;
    stock: number;
}
export interface WebhookRegistrationResult {
    topic: string;
    externalId: string;
    callbackUrl: string;
}
export interface EcommerceDriverInterface {
    testConnection(): Promise<boolean>;
    pushProduct(payload: SyncProductPayload): Promise<SyncResult>;
    updateProduct(externalId: string, payload: Partial<SyncProductPayload>): Promise<SyncResult>;
    setInventoryLevel(payload: InventorySyncPayload): Promise<SyncResult>;
    pullOrders(since?: Date): Promise<ExternalOrder[]>;
    registerWebhooks(baseUrl: string, connectionId: string): Promise<WebhookRegistrationResult[]>;
    unregisterWebhook(externalWebhookId: string): Promise<void>;
    getLocations?(): Promise<{
        id: string;
        name: string;
    }[]>;
}
