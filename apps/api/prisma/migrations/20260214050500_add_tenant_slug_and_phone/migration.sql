-- AlterTable: Add slug and phone fields to Tenant
-- Step 1: Add nullable slug column first
ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT;

-- Step 2: Add nullable phone column
ALTER TABLE "Tenant" ADD COLUMN "phone" TEXT;

-- Step 3: Generate unique slugs for existing tenants
-- This uses a combination of lowercase name with hyphens and row number to ensure uniqueness
WITH numbered_tenants AS (
  SELECT 
    id, 
    name,
    ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "Tenant"
  WHERE slug IS NULL
)
UPDATE "Tenant" t
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(nt.name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || CASE 
    WHEN nt.rn > 1 THEN '-' || nt.rn::text 
    ELSE '' 
  END
FROM numbered_tenants nt
WHERE t.id = nt.id;

-- Step 4: Make slug NOT NULL and add unique constraint
ALTER TABLE "Tenant" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
