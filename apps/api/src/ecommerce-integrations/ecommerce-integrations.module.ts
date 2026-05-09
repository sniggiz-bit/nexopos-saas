import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { IntegrationService } from './services/integration.service';
import { ProductSyncService } from './services/product-sync.service';
import { InventorySyncService } from './services/inventory-sync.service';
import { OrderSyncService } from './services/order-sync.service';
import { WebhookService } from './services/webhook.service';

import { IntegrationsController } from './controllers/integrations.controller';
import { WebhooksController } from './controllers/webhooks.controller';

import { SyncProductsJob } from './jobs/sync-products.job';
import { SyncInventoryJob } from './jobs/sync-inventory.job';
import { PullOrdersJob } from './jobs/pull-orders.job';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController, WebhooksController],
  providers: [
    IntegrationService,
    ProductSyncService,
    InventorySyncService,
    OrderSyncService,
    WebhookService,
    SyncProductsJob,
    SyncInventoryJob,
    PullOrdersJob,
  ],
  exports: [IntegrationService, InventorySyncService],
})
export class EcommerceIntegrationsModule {}
