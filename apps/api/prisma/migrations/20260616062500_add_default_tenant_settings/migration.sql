-- Create default TenantSettings for any Tenant that doesn't have them
INSERT INTO "TenantSettings" (
  "id",
  "tenantId",
  "enableBoletaDte",
  "enableFacturaDte",
  "enableGuiaDespachoDte",
  "enableNotaCreditoDte",
  "maxBranches",
  "maxRegisters",
  "maxUsers",
  "canHardDelete",
  "enableEcommerce",
  "enableTransbank",
  "enableIntegrations",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  t.id,
  true,
  true,
  true,
  true,
  10,
  10,
  20,
  false,
  true,
  false,
  false,
  NOW(),
  NOW()
FROM "Tenant" t
LEFT JOIN "TenantSettings" ts ON ts."tenantId" = t.id
WHERE ts.id IS NULL;
