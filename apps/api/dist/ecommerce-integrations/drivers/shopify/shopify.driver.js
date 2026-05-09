"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyDriver = void 0;
const common_1 = require("@nestjs/common");
const shopify_client_1 = require("./shopify.client");
const WEBHOOK_TOPICS = [
    'orders/create',
    'orders/updated',
    'orders/paid',
    'products/update',
    'products/delete',
];
class ShopifyDriver {
    client;
    logger = new common_1.Logger(ShopifyDriver.name);
    locationId;
    constructor(shopDomain, accessToken, locationId) {
        this.client = new shopify_client_1.ShopifyClient(shopDomain, accessToken);
        this.locationId = locationId ?? '';
    }
    async testConnection() {
        return this.client.testConnection();
    }
    async pushProduct(payload) {
        try {
            const product = await this.client.createProduct({
                title: payload.name,
                status: 'active',
                variants: [
                    {
                        sku: payload.sku,
                        price: String(payload.price / 100),
                        inventory_management: 'shopify',
                        inventory_quantity: payload.stock,
                    },
                ],
                images: payload.imageUrl ? [{ src: payload.imageUrl }] : [],
                body_html: payload.description,
            });
            const variantId = String(product.variants[0]?.id);
            if (this.locationId && product.variants[0]?.inventory_item_id) {
                await this.client.setInventoryLevel(this.locationId, String(product.variants[0].inventory_item_id), payload.stock);
            }
            return {
                success: true,
                externalId: String(product.id),
                externalVariantId: variantId,
            };
        }
        catch (error) {
            this.logger.error(`pushProduct failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async updateProduct(externalId, payload) {
        try {
            await this.client.updateProduct(externalId, {
                title: payload.name,
                body_html: payload.description,
                variants: payload.price !== undefined
                    ? [{ price: String(payload.price / 100) }]
                    : undefined,
            });
            return { success: true, externalId };
        }
        catch (error) {
            this.logger.error(`updateProduct failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async setInventoryLevel(payload) {
        try {
            if (!this.locationId) {
                return { success: false, error: 'locationId not configured' };
            }
            const inventoryItemId = payload.externalVariantId ?? payload.externalId;
            await this.client.setInventoryLevel(this.locationId, inventoryItemId, payload.stock);
            return { success: true, externalId: payload.externalId };
        }
        catch (error) {
            this.logger.error(`setInventoryLevel failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async pullOrders(since) {
        try {
            const shopifyOrders = await this.client.getOrders(since);
            return shopifyOrders.map((o) => ({
                externalId: String(o.id),
                externalNumber: String(o.order_number),
                status: o.financial_status,
                customer: o.customer
                    ? {
                        email: o.customer.email,
                        name: `${o.customer.first_name ?? ''} ${o.customer.last_name ?? ''}`.trim(),
                        phone: o.customer.phone ?? o.billing_address?.phone,
                        address: o.billing_address?.address1,
                    }
                    : undefined,
                items: o.line_items.map((li) => ({
                    externalProductId: String(li.product_id ?? ''),
                    productName: li.title,
                    quantity: li.quantity,
                    price: Math.round(parseFloat(li.price) * 100),
                })),
                total: Math.round(parseFloat(o.total_price) * 100),
                currency: o.currency,
                createdAt: o.created_at,
                rawData: o,
            }));
        }
        catch (error) {
            this.logger.error(`pullOrders failed: ${error.message}`);
            return [];
        }
    }
    async registerWebhooks(baseUrl, connectionId) {
        const results = [];
        for (const topic of WEBHOOK_TOPICS) {
            try {
                const callbackUrl = `${baseUrl}/webhooks/shopify/${connectionId}`;
                const wh = await this.client.createWebhook(topic, callbackUrl);
                results.push({ topic, externalId: String(wh.id), callbackUrl });
            }
            catch (error) {
                this.logger.warn(`Failed to register webhook ${topic}: ${error.message}`);
            }
        }
        return results;
    }
    async unregisterWebhook(externalWebhookId) {
        await this.client.deleteWebhook(externalWebhookId);
    }
    async getLocations() {
        const locations = await this.client.getLocations();
        return locations.map((l) => ({ id: String(l.id), name: l.name }));
    }
}
exports.ShopifyDriver = ShopifyDriver;
//# sourceMappingURL=shopify.driver.js.map