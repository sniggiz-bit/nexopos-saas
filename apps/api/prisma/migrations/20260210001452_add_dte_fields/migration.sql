/*
  Warnings:

  - You are about to drop the column `dte_folio` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `dte_status` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `dte_type` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "dte_folio",
DROP COLUMN "dte_status",
DROP COLUMN "dte_type",
ADD COLUMN     "dteFolio" INTEGER,
ADD COLUMN     "dteStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "dteType" INTEGER NOT NULL DEFAULT 39;
