-- AlterTable: Add includeIva column to Quote table
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "includeIva" BOOLEAN NOT NULL DEFAULT true;
