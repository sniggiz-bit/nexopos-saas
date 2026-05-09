import { IntegrationService } from '../services/integration.service';
import { ProductSyncService } from '../services/product-sync.service';
import { InventorySyncService } from '../services/inventory-sync.service';
import { OrderSyncService } from '../services/order-sync.service';
import { WebhookService } from '../services/webhook.service';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
export declare class IntegrationsController {
    private readonly integrationService;
    private readonly productSyncService;
    private readonly inventorySyncService;
    private readonly orderSyncService;
    private readonly webhookService;
    constructor(integrationService: IntegrationService, productSyncService: ProductSyncService, inventorySyncService: InventorySyncService, orderSyncService: OrderSyncService, webhookService: WebhookService);
    create(req: any, dto: CreateConnectionDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tenantId: string;
        platform: import("@prisma/client").$Enums.EcommercePlatform;
        shopDomain: string | null;
        accessToken: string | null;
        locationId: string | null;
        webhookSecret: string | null;
        siteUrl: string | null;
        consumerKey: string | null;
        consumerSecret: string | null;
        syncProducts: boolean;
        syncInventory: boolean;
        syncOrders: boolean;
        syncCustomers: boolean;
        autoCreateSale: boolean;
        lastSyncAt: Date | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        lastError: string | null;
    }>;
    findAll(req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: import("@prisma/client").$Enums.EcommercePlatform;
        shopDomain: string | null;
        locationId: string | null;
        siteUrl: string | null;
        syncProducts: boolean;
        syncInventory: boolean;
        syncOrders: boolean;
        syncCustomers: boolean;
        autoCreateSale: boolean;
        lastSyncAt: Date | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        lastError: string | null;
    }[]>;
    findOne(req: any, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tenantId: string;
        platform: import("@prisma/client").$Enums.EcommercePlatform;
        shopDomain: string | null;
        accessToken: string | null;
        locationId: string | null;
        webhookSecret: string | null;
        siteUrl: string | null;
        consumerKey: string | null;
        consumerSecret: string | null;
        syncProducts: boolean;
        syncInventory: boolean;
        syncOrders: boolean;
        syncCustomers: boolean;
        autoCreateSale: boolean;
        lastSyncAt: Date | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        lastError: string | null;
    }>;
    update(req: any, id: string, dto: UpdateConnectionDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        tenantId: string;
        platform: import("@prisma/client").$Enums.EcommercePlatform;
        shopDomain: string | null;
        accessToken: string | null;
        locationId: string | null;
        webhookSecret: string | null;
        siteUrl: string | null;
        consumerKey: string | null;
        consumerSecret: string | null;
        syncProducts: boolean;
        syncInventory: boolean;
        syncOrders: boolean;
        syncCustomers: boolean;
        autoCreateSale: boolean;
        lastSyncAt: Date | null;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        lastError: string | null;
    }>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
    testConnection(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    syncProducts(req: any, id: string): Promise<{
        message: string;
    }>;
    syncInventory(req: any, id: string): Promise<{
        message: string;
    }>;
    syncOrders(req: any, id: string): Promise<{
        message: string;
    }>;
    syncFull(req: any, id: string): Promise<{
        message: string;
    }>;
    registerWebhooks(req: any, id: string, baseUrl: string): Promise<{
        message: string;
    }>;
    getMappings(req: any, id: string): Promise<({
        product: {
            name: string;
            id: string;
            sku: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        connectionId: string;
        externalId: string;
        nexoposProductId: string;
        externalVariantId: string | null;
        lastPushedAt: Date | null;
        lastPulledAt: Date | null;
    })[]>;
    deleteMapping(req: any, id: string, mappingId: string): Promise<{
        message: string;
    }>;
    getOrders(req: any, connectionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EcommerceOrderStatus;
        tenantId: string;
        saleId: string | null;
        platform: import("@prisma/client").$Enums.EcommercePlatform;
        connectionId: string;
        externalId: string;
        externalNumber: string | null;
        rawData: import("@prisma/client/runtime/client").JsonValue;
        processedAt: Date | null;
        errorMessage: string | null;
    }[]>;
    processOrder(id: string): Promise<{
        saleId?: string;
        message: string;
    }>;
    getLogs(req: any, connectionId?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.SyncStatus;
        tenantId: string;
        total: number;
        connectionId: string;
        entityType: import("@prisma/client").$Enums.SyncEntityType;
        direction: import("@prisma/client").$Enums.SyncDirection;
        synced: number;
        failed: number;
        errors: import("@prisma/client/runtime/client").JsonValue | null;
        durationMs: number | null;
        startedAt: Date;
        completedAt: Date | null;
    }[]>;
}
