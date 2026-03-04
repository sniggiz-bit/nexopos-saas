/*
  Warnings:

  - The values [ADMIN,USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('TENANT_ADMIN', 'CASHIER', 'MANAGER', 'SUPER_ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE 
    WHEN "role"::text = 'ADMIN' THEN 'TENANT_ADMIN'::text::"UserRole_new"
    WHEN "role"::text = 'USER' THEN 'MANAGER'::text::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MANAGER';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MANAGER';
