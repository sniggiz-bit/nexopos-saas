export declare enum EcommercePlatformDto {
    SHOPIFY = "SHOPIFY",
    WOOCOMMERCE = "WOOCOMMERCE"
}
export declare class CreateConnectionDto {
    platform: EcommercePlatformDto;
    name: string;
    shopDomain?: string;
    accessToken?: string;
    locationId?: string;
    siteUrl?: string;
    consumerKey?: string;
    consumerSecret?: string;
    syncProducts?: boolean;
    syncInventory?: boolean;
    syncOrders?: boolean;
    syncCustomers?: boolean;
    autoCreateSale?: boolean;
}
