-- =============================================================
-- SEED DATOS DE PRUEBA — Tenant: admin@demo.cl
-- Idempotente: se puede ejecutar múltiples veces sin duplicados
-- =============================================================

DO $$
DECLARE
  v_tenant_id TEXT := '1947ed40-5b3b-410c-b56a-40630fa764a3';
  v_branch_id TEXT;
  cat_bebidas TEXT; cat_lacteos TEXT; cat_snacks TEXT; cat_panaderia TEXT;
  cat_limpieza TEXT; cat_higiene TEXT; cat_congelados TEXT; cat_varios TEXT;
  brand_ccola TEXT; brand_nestle TEXT; brand_soprole TEXT;
  brand_watts TEXT; brand_carozzi TEXT; brand_generico TEXT;
  p_id TEXT;
BEGIN
  -- SUCURSAL
  SELECT id INTO v_branch_id FROM "Branch" WHERE "tenantId" = v_tenant_id AND "isMain" = true LIMIT 1;
  IF v_branch_id IS NULL THEN
    v_branch_id := gen_random_uuid()::TEXT;
    INSERT INTO "Branch" (id, name, "isMain", "isActive", "tenantId", "createdAt", "updatedAt")
    VALUES (v_branch_id, 'Casa Matriz', true, true, v_tenant_id, NOW(), NOW());
  END IF;

  -- CATEGORÍAS (idempotente)
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Bebidas',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Lácteos',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Snacks y Dulces',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Panadería',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Limpieza del Hogar',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Higiene Personal',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Congelados',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Varios',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;

  SELECT id INTO cat_bebidas    FROM "Category" WHERE name='Bebidas'            AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_lacteos    FROM "Category" WHERE name='Lácteos'            AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_snacks     FROM "Category" WHERE name='Snacks y Dulces'    AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_panaderia  FROM "Category" WHERE name='Panadería'          AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_limpieza   FROM "Category" WHERE name='Limpieza del Hogar' AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_higiene    FROM "Category" WHERE name='Higiene Personal'   AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_congelados FROM "Category" WHERE name='Congelados'         AND "tenantId"=v_tenant_id;
  SELECT id INTO cat_varios     FROM "Category" WHERE name='Varios'             AND "tenantId"=v_tenant_id;

  -- MARCAS (idempotente)
  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Coca-Cola',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Nestlé',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Soprole',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Watt''s',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Carozzi',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;
  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::TEXT,'Genérico',v_tenant_id,NOW(),NOW()) ON CONFLICT (name,"tenantId") DO NOTHING;

  SELECT id INTO brand_ccola    FROM "Brand" WHERE name='Coca-Cola' AND "tenantId"=v_tenant_id;
  SELECT id INTO brand_nestle   FROM "Brand" WHERE name='Nestlé'    AND "tenantId"=v_tenant_id;
  SELECT id INTO brand_soprole  FROM "Brand" WHERE name='Soprole'   AND "tenantId"=v_tenant_id;
  SELECT id INTO brand_watts    FROM "Brand" WHERE name='Watt''s'   AND "tenantId"=v_tenant_id;
  SELECT id INTO brand_carozzi  FROM "Brand" WHERE name='Carozzi'   AND "tenantId"=v_tenant_id;
  SELECT id INTO brand_generico FROM "Brand" WHERE name='Genérico'  AND "tenantId"=v_tenant_id;

  -- PRODUCTOS (solo si no existen por SKU)
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='BEB-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Coca-Cola 350ml','BEB-001','7800146000015',950,650,v_tenant_id,cat_bebidas,brand_ccola,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,48,12,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='BEB-002' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Coca-Cola 1.5L','BEB-002','7800146001012',1990,1400,v_tenant_id,cat_bebidas,brand_ccola,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,24,6,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='BEB-003' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Agua Mineral 500ml','BEB-003','7802120001015',590,350,v_tenant_id,cat_bebidas,brand_watts,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,60,24,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='BEB-004' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Jugo Watt''s Manzana 1L','BEB-004','7802120002019',1490,1050,v_tenant_id,cat_bebidas,brand_watts,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,24,6,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='LAC-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Leche Entera 1L','LAC-001','7801610002015',1190,850,v_tenant_id,cat_lacteos,brand_soprole,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,48,12,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='LAC-002' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Yogurt Natural 165g','LAC-002','7801610003012',690,480,v_tenant_id,cat_lacteos,brand_soprole,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,30,10,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='LAC-003' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Queso Mantecoso 200g','LAC-003','7801610004019',2290,1700,v_tenant_id,cat_lacteos,brand_soprole,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,20,5,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='SNK-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Papas Fritas 145g','SNK-001','7591778001015',1490,1050,v_tenant_id,cat_snacks,brand_generico,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,24,6,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='SNK-002' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Chocolate Nestlé 100g','SNK-002','7613035217775',1290,900,v_tenant_id,cat_snacks,brand_nestle,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,30,10,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='SNK-003' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Galletas Carozzi 200g','SNK-003','7801740001019',890,620,v_tenant_id,cat_snacks,brand_carozzi,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,30,10,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='PAN-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Pan de Molde 500g','PAN-001','7802120004013',1690,1200,v_tenant_id,cat_panaderia,brand_carozzi,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,20,5,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='LIM-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Detergente Omo 800g','LIM-001','7891150023229',3990,2900,v_tenant_id,cat_limpieza,brand_generico,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,15,5,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='LIM-002' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Papel Higiénico 4 rollos','LIM-002','7801540001014',1990,1400,v_tenant_id,cat_limpieza,brand_generico,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,30,10,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='HIG-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Shampoo 400ml','HIG-001','7509546050091',5490,4000,v_tenant_id,cat_higiene,brand_generico,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,12,3,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='HIG-002' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Pasta Dental 90g','HIG-002','7509546060090',1890,1300,v_tenant_id,cat_higiene,brand_generico,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,24,6,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='CON-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Helado Nestlé Vainilla 1L','CON-001','7613035010017',3490,2500,v_tenant_id,cat_congelados,brand_nestle,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,10,3,NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Product" WHERE sku='VAR-001' AND "tenantId"=v_tenant_id) THEN
    p_id := gen_random_uuid()::TEXT;
    INSERT INTO "Product" (id,name,sku,barcode,price,"costPrice","tenantId","categoryId","brandId","isActive","unitType","createdAt","updatedAt") VALUES (p_id,'Pila AA x2','VAR-001','5000394107564',2490,1800,v_tenant_id,cat_varios,brand_generico,true,'UNIT',NOW(),NOW());
    INSERT INTO "InventoryLevel" (id,"productId","branchId",quantity,"minStock","updatedAt") VALUES (gen_random_uuid()::TEXT,p_id,v_branch_id,20,5,NOW());
  END IF;

  RAISE NOTICE 'Seed completado: 8 categorias, 6 marcas, 16 productos con inventario.';
END $$;
