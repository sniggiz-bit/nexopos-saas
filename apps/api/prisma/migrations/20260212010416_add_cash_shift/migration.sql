/*
  Warnings:

  - You are about to drop the column `closedByUserId` on the `CashShift` table. All the data in the column will be lost.
  - You are about to drop the column `openedByUserId` on the `CashShift` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `CashShift` table. All the data in the column will be lost.
  - The `status` column on the `CashShift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `openedBy` to the `CashShift` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CashShift" DROP CONSTRAINT "CashShift_closedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "CashShift" DROP CONSTRAINT "CashShift_openedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "CashShift" DROP CONSTRAINT "CashShift_tenantId_fkey";

-- AlterTable
ALTER TABLE "CashShift" DROP COLUMN "closedByUserId",
DROP COLUMN "openedByUserId",
DROP COLUMN "tenantId",
ADD COLUMN     "closedBy" TEXT,
ADD COLUMN     "openedBy" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "ShiftStatus";
