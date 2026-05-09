-- CreateEnum
CREATE TYPE "EcommercePlatform" AS ENUM ('SHOPIFY', 'WOOCOMMERCE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'SYNCING', 'SUCCESS', 'ERROR', 'PARTIAL');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('PUSH', 'PULL');

-- CreateEnum
CREATE TYPE "SyncEntityType" AS ENUM ('PRODUCT', 'INVENTORY', 'ORDER', 'CUSTOMER', 'FULL');

-- CreateEnum
CREATE TYPE "EcommerceOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'IGNORED');

-- CreateTable: EcommerceConnection
CREATE TABLE "EcommerceConnection" (
    "id"             TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "platform"       "EcommercePlatform" NOT NULL,
    "name"           TEXT NOT NULL,
    "shopDomain"     TEXT,
    "accessToken"    TEXT,
    "locationId"     TEXT,
    "webhookSecret"  TEXT,
    "siteUrl"        TEXT,
    "consumerKey"    TEXT,
    "consumerSecret" TEXT,
    "syncProducts"   BOOLEAN NOT NULL DEFAULT true,
    "syncInventory"  BOOLEAN NOT NULL DEFAULT true,
    "syncOrders"     BOOLEAN NOT NULL DEFAULT true,
    "syncCustomers"  BOOLEAN NOT NULL DEFAULT false,
    "autoCreateSale" BOOLEAN NOT NULL DEFAULT false,
    "isActive"       BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt"     TIMESTAMP(3),
    "syncStatus"     "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastError"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcommerceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductMapping
CREATE TABLE "ProductMapping" (
    "id"               TEXT NOT NULL,
    "connectionId"     TEXT NOT NULL,
    "nexoposProductId" TEXT NOT NULL,
    "externalId"       TEXT NOT NULL,
    "externalVariantId" TEXT,
    "lastPushedAt"     TIMESTAMP(3),
    "lastPulledAt"     TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RegisteredWebhook
CREATE TABLE "RegisteredWebhook" (
    "id"           TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "topic"        TEXT NOT NULL,
    "externalId"   TEXT NOT NULL,
    "callbackUrl"  TEXT NOT NULL,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegisteredWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EcommerceOrder
CREATE TABLE "EcommerceOrder" (
    "id"             TEXT NOT NULL,
    "connectionId"   TEXT NOT NULL,
    "tenantId"       TEXT NOT NULL,
    "externalId"     TEXT NOT NULL,
    "externalNumber" TEXT,
    "platform"       "EcommercePlatform" NOT NULL,
    "status"         "EcommerceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "rawData"        JSONB NOT NULL,
    "processedAt"    TIMESTAMP(3),
    "saleId"         TEXT,
    "errorMessage"   TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcommerceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SyncLog
CREATE TABLE "SyncLog" (
    "id"           TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "entityType"   "SyncEntityType" NOT NULL,
    "direction"    "SyncDirection" NOT NULL,
    "status"       "SyncStatus" NOT NULL,
    "total"        INTEGER NOT NULL DEFAULT 0,
    "synced"       INTEGER NOT NULL DEFAULT 0,
    "failed"       INTEGER NOT NULL DEFAULT 0,
    "errors"       JSONB,
    "durationMs"   INTEGER,
    "startedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"  TIMESTAMP(3),

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "ProductMapping"
    ADD CONSTRAINT "ProductMapping_connectionId_nexoposProductId_key"
    UNIQUE ("connectionId", "nexoposProductId");

ALTER TABLE "ProductMapping"
    ADD CONSTRAINT "ProductMapping_connectionId_externalId_key"
    UNIQUE ("connectionId", "externalId");

ALTER TABLE "EcommerceOrder"
    ADD CONSTRAINT "EcommerceOrder_connectionId_externalId_key"
    UNIQUE ("connectionId", "externalId");

-- Foreign Keys: EcommerceConnection
ALTER TABLE "EcommerceConnection"
    ADD CONSTRAINT "EcommerceConnection_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: ProductMapping
ALTER TABLE "ProductMapping"
    ADD CONSTRAINT "ProductMapping_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "EcommerceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductMapping"
    ADD CONSTRAINT "ProductMapping_nexoposProductId_fkey"
    FOREIGN KEY ("nexoposProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: RegisteredWebhook
ALTER TABLE "RegisteredWebhook"
    ADD CONSTRAINT "RegisteredWebhook_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "EcommerceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: EcommerceOrder
ALTER TABLE "EcommerceOrder"
    ADD CONSTRAINT "EcommerceOrder_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "EcommerceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EcommerceOrder"
    ADD CONSTRAINT "EcommerceOrder_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: SyncLog
ALTER TABLE "SyncLog"
    ADD CONSTRAINT "SyncLog_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "EcommerceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
