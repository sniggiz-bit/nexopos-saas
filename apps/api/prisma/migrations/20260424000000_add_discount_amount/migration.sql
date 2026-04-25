-- AlterTable Sale: add discountAmount with default 0
ALTER TABLE "Sale" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable SaleItem: add discountAmount with default 0
ALTER TABLE "SaleItem" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
