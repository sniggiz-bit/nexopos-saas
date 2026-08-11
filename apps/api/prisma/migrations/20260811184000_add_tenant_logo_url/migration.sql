-- AlterTable: Add logoUrl column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
