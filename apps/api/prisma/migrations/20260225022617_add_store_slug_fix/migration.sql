/*
  Warnings:

  - You are about to drop the column `expiryDate` on the `Quote` table. All the data in the column will be lost.
  - The `status` column on the `Quote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `maxProducts` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsers` on the `Tenant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[storeSlug]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `total` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "expiryDate",
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "validUntil" TIMESTAMP(3),
ALTER COLUMN "total" SET DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "maxProducts",
DROP COLUMN "maxUsers",
ADD COLUMN     "storeSettings" JSONB,
ADD COLUMN     "storeSlug" TEXT;

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enableBoletaDte" BOOLEAN NOT NULL DEFAULT false,
    "enableFacturaDte" BOOLEAN NOT NULL DEFAULT false,
    "enableGuiaDespachoDte" BOOLEAN NOT NULL DEFAULT false,
    "enableNotaCreditoDte" BOOLEAN NOT NULL DEFAULT false,
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxRegisters" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 3,
    "canHardDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_storeSlug_key" ON "Tenant"("storeSlug");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
