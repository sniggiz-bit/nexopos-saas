-- Create LandingConfig singleton table
CREATE TABLE IF NOT EXISTS "LandingConfig" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "data" JSONB NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LandingConfig_pkey" PRIMARY KEY ("id")
);
