-- Add enabledFeatures JSON column to Plan and set default for maxProducts
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "enabledFeatures" JSONB;
ALTER TABLE "Plan" ALTER COLUMN "maxProducts" SET DEFAULT 500;
UPDATE "Plan" SET "maxProducts" = 500 WHERE "maxProducts" IS NULL;
