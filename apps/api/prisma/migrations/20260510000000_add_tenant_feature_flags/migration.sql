-- Add feature flag columns to TenantSettings
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "enableEcommerce" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "enableTransbank" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "enableIntegrations" BOOLEAN NOT NULL DEFAULT false;
