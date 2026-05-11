-- Re-assign all products, categories and brands to the demo tenant if they belong to tenant-1
UPDATE "Product" SET "tenantId" = '78a08935-797b-4123-90ab-a4b32709cad7' WHERE "tenantId" = 'tenant-1';
UPDATE "Category" SET "tenantId" = '78a08935-797b-4123-90ab-a4b32709cad7' WHERE "tenantId" = 'tenant-1';
UPDATE "Brand" SET "tenantId" = '78a08935-797b-4123-90ab-a4b32709cad7' WHERE "tenantId" = 'tenant-1';
UPDATE "Supplier" SET "tenantId" = '78a08935-797b-4123-90ab-a4b32709cad7' WHERE "tenantId" = 'tenant-1';
