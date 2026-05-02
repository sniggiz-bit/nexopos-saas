-- CreateEnum
CREATE TYPE "TransbankStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ERROR', 'CANCELLED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id"                TEXT NOT NULL,
    "tenantId"          TEXT NOT NULL,
    "branchId"          TEXT NOT NULL,
    "saleId"            TEXT,
    "orderId"           TEXT NOT NULL,
    "amount"            INTEGER NOT NULL,
    "status"            "TransbankStatus" NOT NULL DEFAULT 'PENDING',
    "provider"          TEXT NOT NULL DEFAULT 'TRANSBANK_POS',
    "responseCode"      INTEGER,
    "authorizationCode" TEXT,
    "responseMessage"   TEXT,
    "cardType"          TEXT,
    "lastFourDigits"    TEXT,
    "transactionDate"   TIMESTAMP(3),
    "installments"      INTEGER,
    "rawResponse"       JSONB,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_orderId_key" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_tenantId_createdAt_idx" ON "PaymentTransaction"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PaymentTransaction_branchId_idx" ON "PaymentTransaction"("branchId");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
