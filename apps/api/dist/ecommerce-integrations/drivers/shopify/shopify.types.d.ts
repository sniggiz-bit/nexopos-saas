export interface ShopifyProduct {
    id: number;
    title: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    handle: string;
    status: 'active' | 'archived' | 'draft';
    variants: ShopifyVariant[];
    images: ShopifyImage[];
}
export interface ShopifyVariant {
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku?: string;
    inventory_item_id: number;
    inventory_quantity: number;
    inventory_management: string;
}
export interface ShopifyImage {
    id: number;
    src: string;
    alt?: string;
}
export interface ShopifyOrder {
    id: number;
    order_number: number;
    email?: string;
    phone?: string;
    financial_status: string;
    fulfillment_status?: string;
    total_price: string;
    currency: string;
    created_at: string;
    customer?: {
        id: number;
        email?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
    };
    billing_address?: {
        address1?: string;
        city?: string;
        country?: string;
        phone?: string;
    };
    line_items: ShopifyLineItem[];
}
export interface ShopifyLineItem {
    id: number;
    variant_id?: number;
    product_id?: number;
    title: string;
    quantity: number;
    price: string;
    sku?: string;
}
export interface ShopifyInventoryLevel {
    inventory_item_id: number;
    location_id: number;
    available: number;
}
export interface ShopifyLocation {
    id: number;
    name: string;
    active: boolean;
    address1?: string;
    city?: string;
    country?: string;
}
export interface ShopifyWebhook {
    id: number;
    topic: string;
    address: string;
    format: string;
}
