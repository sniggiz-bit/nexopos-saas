UPDATE "Branch" AS branch
SET "address" = tenant."address"
FROM "Tenant" AS tenant
WHERE branch."tenantId" = tenant."id"
  AND branch."isMain" = TRUE
  AND (branch."address" IS NULL OR btrim(branch."address") = '')
  AND tenant."address" IS NOT NULL
  AND btrim(tenant."address") <> '';
