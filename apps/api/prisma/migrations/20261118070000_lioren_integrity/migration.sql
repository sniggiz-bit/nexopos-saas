ALTER TABLE "Sale" ADD COLUMN "dteProviderId" TEXT, ADD COLUMN "dteIssuerRut" TEXT, ADD COLUMN "dteIssuedAt" TIMESTAMP(3), ADD COLUMN "dteVerifiedAt" TIMESTAMP(3);
CREATE TABLE "DteSubmission" (
  "id" TEXT NOT NULL, "saleId" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL, "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DteSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DteSubmission_saleId_key" ON "DteSubmission"("saleId");
CREATE INDEX "DteSubmission_tenantId_idx" ON "DteSubmission"("tenantId");
ALTER TABLE "DteSubmission" ADD CONSTRAINT "DteSubmission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DteSubmission" ADD CONSTRAINT "DteSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD COLUMN "city" TEXT;
