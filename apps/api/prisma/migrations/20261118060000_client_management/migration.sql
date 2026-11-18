ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "TenantModuleOverride" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  CONSTRAINT "TenantModuleOverride_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantModuleOverride_tenantId_moduleId_key" ON "TenantModuleOverride"("tenantId", "moduleId");
ALTER TABLE "TenantModuleOverride" ADD CONSTRAINT "TenantModuleOverride_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantModuleOverride" ADD CONSTRAINT "TenantModuleOverride_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UploadAsset" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UploadAsset_path_key" ON "UploadAsset"("path");
CREATE INDEX "UploadAsset_tenantId_idx" ON "UploadAsset"("tenantId");
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
