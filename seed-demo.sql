-- =============================================================
-- SEED DATOS DE PRUEBA — Tenant: admin@demo.cl
-- Tenant ID: 1947ed40-5b3b-410c-b56a-40630fa764a3
-- =============================================================

DO $$
DECLARE
  v_tenant_id TEXT := '1947ed40-5b3b-410c-b56a-40630fa764a3';
  v_branch_id TEXT;

  -- Categorías
  cat_bebidas      TEXT;
  cat_lacteos      TEXT;
  cat_snacks       TEXT;
  cat_panaderia    TEXT;
  cat_limpieza     TEXT;
  cat_higiene      TEXT;
  cat_congelados   TEXT;
  cat_varios       TEXT;

  -- Marcas
  brand_ccola      TEXT;
  brand_nestle     TEXT;
  brand_soprole    TEXT;
  brand_watts      TEXT;
  brand_carozzi    TEXT;
  brand_generico   TEXT;

  -- Productos
  p_id TEXT;

BEGIN

  -- ===== SUCURSAL CASA MATRIZ =====
  SELECT id INTO v_branch_id FROM "Branch" WHERE "tenantId" = v_tenant_id AND "isMain" = true LIMIT 1;
  IF v_branch_id IS NULL THEN
    v_branch_id := gen_random_uuid()::TEXT;
    INSERT INTO "Branch" (id, name, "isMain", "isActive", "tenantId", "createdAt", "updatedAt")
    VALUES (v_branch_id, 'Casa Matriz', true, true, v_tenant_id, NOW(), NOW());
  END IF;

  -- ===== CATEGORÍAS =====
  cat_bebidas   := gen_random_uuid()::TEXT;
  cat_lacteos   := gen_random_uuid()::TEXT;
  cat_snacks    := gen_random_uuid()::TEXT;
  cat_panaderia := gen_random_uuid()::TEXT;
  cat_limpieza  := gen_random_uuid()::TEXT;
  cat_higiene   := gen_random_uuid()::TEXT;
  cat_congelados:= gen_random_uuid()::TEXT;
  cat_varios    := gen_random_uuid()::TEXT;

  INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES
    (cat_bebidas,    'Bebidas',           v_tenant_id, NOW(), NOW()),
    (cat_lacteos,    'Lácteos',           v_tenant_id, NOW(), NOW()),
    (cat_snacks,     'Snacks y Dulces',   v_tenant_id, NOW(), NOW()),
    (cat_panaderia,  'Panadería',         v_tenant_id, NOW(), NOW()),
    (cat_limpieza,   'Limpieza del Hogar',v_tenant_id, NOW(), NOW()),
    (cat_higiene,    'Higiene Personal',  v_tenant_id, NOW(), NOW()),
    (cat_congelados, 'Congelados',        v_tenant_id, NOW(), NOW()),
    (cat_varios,     'Varios',            v_tenant_id, NOW(), NOW());

  -- ===== MARCAS =====
  brand_ccola    := gen_random_uuid()::TEXT;
  brand_nestle   := gen_random_uuid()::TEXT;
  brand_soprole  := gen_random_uuid()::TEXT;
  brand_watts    := gen_random_uuid()::TEXT;
  brand_carozzi  := gen_random_uuid()::TEXT;
  brand_generico := gen_random_uuid()::TEXT;

  INSERT INTO "Brand" (id, name, "tenantId", "createdAt", "updatedAt") VALUES
    (brand_ccola,    'Coca-Cola',  v_tenant_id, NOW(), NOW()),
    (brand_nestle,   'Nestlé',     v_tenant_id, NOW(), NOW()),
    (brand_soprole,  'Soprole',    v_tenant_id, NOW(), NOW()),
    (brand_watts,    'Watt''s',    v_tenant_id, NOW(), NOW()),
    (brand_carozzi,  'Carozzi',    v_tenant_id, NOW(), NOW()),
    (brand_generico, 'Genérico',   v_tenant_id, NOW(), NOW());

  -- ===== MACRO helper: inserta producto + inventario =====
  -- Usamos un bloque inline por cada producto

  -- BEBIDAS
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Coca-Cola 350ml', 'BEB-001', '7800146000015', 950, 650, v_tenant_id, cat_bebidas, brand_ccola, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 48, 12, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Coca-Cola 1.5L', 'BEB-002', '7800146001012', 1990, 1400, v_tenant_id, cat_bebidas, brand_ccola, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 24, 6, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Fanta Naranja 350ml', 'BEB-003', '5449000154479', 950, 650, v_tenant_id, cat_bebidas, brand_ccola, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 36, 12, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Sprite 350ml', 'BEB-004', '5449000131560', 950, 650, v_tenant_id, cat_bebidas, brand_ccola, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 36, 12, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Agua Mineral 500ml', 'BEB-005', '7802120001015', 590, 350, v_tenant_id, cat_bebidas, brand_watts, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 60, 24, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Jugo Watt''s Manzana 1L', 'BEB-006', '7802120002019', 1490, 1050, v_tenant_id, cat_bebidas, brand_watts, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 24, 6, NOW(), NOW());

  -- LÁCTEOS
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Leche Entera 1L', 'LAC-001', '7801610002015', 1190, 850, v_tenant_id, cat_lacteos, brand_soprole, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 48, 12, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Yogurt Soprole Natural 165g', 'LAC-002', '7801610003012', 690, 480, v_tenant_id, cat_lacteos, brand_soprole, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 30, 10, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Queso Mantecoso 200g', 'LAC-003', '7801610004019', 2290, 1700, v_tenant_id, cat_lacteos, brand_soprole, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 20, 5, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Mantequilla 250g', 'LAC-004', '7802120003016', 2490, 1900, v_tenant_id, cat_lacteos, brand_watts, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 15, 5, NOW(), NOW());

  -- SNACKS
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Papas Fritas Lays 145g', 'SNK-001', '7591778001015', 1490, 1050, v_tenant_id, cat_snacks, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 24, 6, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Chocolate Nestlé 100g', 'SNK-002', '7613035217775', 1290, 900, v_tenant_id, cat_snacks, brand_nestle, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 30, 10, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Galletas Oreo 154g', 'SNK-003', '7622210951403', 1490, 1050, v_tenant_id, cat_snacks, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 24, 8, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Galletas Carozzi Animalitos 200g', 'SNK-004', '7801740001019', 890, 620, v_tenant_id, cat_snacks, brand_carozzi, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 30, 10, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Maní Salado 100g', 'SNK-005', '7801740002016', 790, 520, v_tenant_id, cat_snacks, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 40, 10, NOW(), NOW());

  -- PANADERÍA
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Pan de Molde 500g', 'PAN-001', '7802120004013', 1690, 1200, v_tenant_id, cat_panaderia, brand_carozzi, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 20, 5, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Marraqueta (unidad)', 'PAN-002', NULL, 190, 100, v_tenant_id, cat_panaderia, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 100, 20, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Hallulla (unidad)', 'PAN-003', NULL, 190, 100, v_tenant_id, cat_panaderia, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 80, 20, NOW(), NOW());

  -- LIMPIEZA
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Detergente Omo 800g', 'LIM-001', '7891150023229', 3990, 2900, v_tenant_id, cat_limpieza, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 15, 5, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Cloro 1L', 'LIM-002', '7800070001015', 890, 580, v_tenant_id, cat_limpieza, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 20, 5, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Papel Higiénico 4 rollos', 'LIM-003', '7801540001014', 1990, 1400, v_tenant_id, cat_limpieza, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 30, 10, NOW(), NOW());

  -- HIGIENE PERSONAL
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Shampoo Head & Shoulders 400ml', 'HIG-001', '7509546050091', 5490, 4000, v_tenant_id, cat_higiene, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 12, 3, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Pasta Dental Colgate 90g', 'HIG-002', '7509546060090', 1890, 1300, v_tenant_id, cat_higiene, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 24, 6, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "updatedAt", "unitType", "createdAt")
    VALUES (p_id, 'Jabón Dove 90g', 'HIG-003', '7891150022680', 990, 680, v_tenant_id, cat_higiene, brand_generico, true, NOW(), 'UNIT', NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 30, 10, NOW(), NOW());

  -- CONGELADOS
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Helado Nestlé Vainilla 1L', 'CON-001', '7613035010017', 3490, 2500, v_tenant_id, cat_congelados, brand_nestle, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 10, 3, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Pizza Congelada 400g', 'CON-002', '7801740003013', 4990, 3600, v_tenant_id, cat_congelados, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 8, 3, NOW(), NOW());

  -- VARIOS
  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Pila AA Duracell x2', 'VAR-001', '5000394107564', 2490, 1800, v_tenant_id, cat_varios, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 20, 5, NOW(), NOW());

  p_id := gen_random_uuid()::TEXT;
  INSERT INTO "Product" (id, name, sku, barcode, price, "costPrice", "tenantId", "categoryId", "brandId", "isActive", "unitType", "createdAt", "updatedAt")
    VALUES (p_id, 'Encendedor BIC', 'VAR-002', '3501170100348', 890, 600, v_tenant_id, cat_varios, brand_generico, true, 'UNIT', NOW(), NOW());
  INSERT INTO "Inventory" (id, "productId", "branchId", quantity, "minStock", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::TEXT, p_id, v_branch_id, 15, 5, NOW(), NOW());

  RAISE NOTICE 'Seed completado: 8 categorías, 6 marcas, 22 productos con inventario.';
END $$;
