-- Phase 1: Remove deprecated columns from Tenant
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "maxUsers";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "maxProducts";

-- Phase 1: Create TenantSettings table
CREATE TABLE IF NOT EXISTS "TenantSettings" (
    "id"                    TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenantId"              TEXT NOT NULL,
    "enableBoletaDte"       BOOLEAN NOT NULL DEFAULT false,
    "enableFacturaDte"      BOOLEAN NOT NULL DEFAULT false,
    "enableGuiaDespachoDte" BOOLEAN NOT NULL DEFAULT false,
    "enableNotaCreditoDte"  BOOLEAN NOT NULL DEFAULT false,
    "maxBranches"           INTEGER NOT NULL DEFAULT 1,
    "maxRegisters"          INTEGER NOT NULL DEFAULT 1,
    "maxUsers"              INTEGER NOT NULL DEFAULT 3,
    "canHardDelete"         BOOLEAN NOT NULL DEFAULT false,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TenantSettings_tenantId_key" UNIQUE ("tenantId")
);

-- Backfill: create TenantSettings for existing tenants
INSERT INTO "TenantSettings" ("id", "tenantId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, NOW(), NOW()
FROM "Tenant"
WHERE id NOT IN (SELECT "tenantId" FROM "TenantSettings");

-- Mark this migration as applied in _prisma_migrations
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'manual_migration_init_tenant_settings',
    NOW(),
    '20260223130000_init_tenant_settings',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;
