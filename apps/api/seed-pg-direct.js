/**
 * seed-pg-direct.js
 * Seed usando pg puro (sin Prisma/WASM) para entornos con memoria limitada (cPanel)
 * Uso: node apps/api/seed-pg-direct.js
 */

require('dotenv/config');
const { Pool } = require('pg');
const crypto = require('crypto');

// Leer DATABASE_URL del .env del API si existe
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match) dbUrl = match[1].trim();
  } catch (e) {}
}

if (!dbUrl) {
  console.error('❌ No se encontró DATABASE_URL. Asegúrate de que apps/api/.env existe.');
  process.exit(1);
}

console.log('🔗 Conectando a:', dbUrl.replace(/:([^:@]+)@/, ':****@'));

const pool = new Pool({ connectionString: dbUrl });

async function hashPassword(password) {
  try {
    const bcrypt = require('bcrypt');
    return await bcrypt.hash(password, 10);
  } catch (e) {
    console.log('⚠️  bcrypt no disponible, usando plain text (se hasheará al primer login)');
    return password;
  }
}

function generateId() {
  return crypto.randomUUID();
}

async function main() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed directo con pg (sin Prisma)...\n');

    // ── 1. MÓDULOS SAAS ─────────────────────────────────────────────────────
    console.log('📦 Creando módulos SaaS...');
    const modules = [
      { code: 'POS', name: 'Punto de Venta', description: 'Sistema principal de caja y ventas' },
      { code: 'QUOTES', name: 'Cotizaciones', description: 'Emisión y seguimiento de cotizaciones' },
      { code: 'CUSTOMERS', name: 'Clientes', description: 'Gestión y fidelización de clientes' },
      { code: 'EXTRA_BRANCH', name: 'Sucursal Adicional', description: 'Gestión de múltiples puntos de venta' },
      { code: 'ECOMMERCE', name: 'Tienda en Línea', description: 'Catálogo público y ventas web nativas' },
      { code: 'SHOPIFY', name: 'Integración Shopify', description: 'Sincronización de productos e inventario' },
      { code: 'WOOCOMMERCE', name: 'Integración WooCommerce', description: 'Sincronización de productos e inventario' },
      { code: 'TRANSBANK', name: 'Integración Transbank', description: 'Cobros electrónicos con Webpay/POS' },
      { code: 'CREDITS', name: 'Créditos', description: 'Ventas a crédito y líneas de crédito' },
      { code: 'DTE_BOLETA', name: 'Boletas Electrónicas', description: 'Emisión de boletas afectas/exentas al SII' },
      { code: 'DTE_FACTURA', name: 'Facturas Electrónicas', description: 'Emisión de facturas electrónicas al SII' },
      { code: 'DTE_NOTA_CREDITO', name: 'Notas de Crédito', description: 'Anulación y corrección de DTEs' },
      { code: 'DTE_GUIA_DESPACHO', name: 'Guías de Despacho', description: 'Emisión de guías de traslado' },
    ];

    for (const mod of modules) {
      await client.query(`
        INSERT INTO "Module" (id, code, name, description)
        VALUES (gen_random_uuid(), $1, $2, $3)
        ON CONFLICT (code) DO UPDATE SET name = $2, description = $3
      `, [mod.code, mod.name, mod.description]);
    }
    console.log(`✅ ${modules.length} módulos SaaS creados/actualizados`);

    // ── 2. PLANES ────────────────────────────────────────────────────────────
    console.log('\n📋 Creando planes...');
    const plans = [
      {
        id: 'plan-light',
        name: 'Plan Light',
        description: 'Ideal para pequeños negocios y emprendedores.',
        price: 29900,
        maxUsers: 2,
        maxProducts: 500,
        maxStorage: 100,
        isRecommended: false,
        features: JSON.stringify(['Multisucursal (Hasta 2)', 'Venta Rápida POS', 'Control de Inventario Básico', 'Reportes Diarios', 'Soporte por Email']),
      },
      {
        id: 'plan-elevate',
        name: 'Plan Elevate',
        description: 'El equilibrio perfecto para negocios en crecimiento.',
        price: 45900,
        maxUsers: 5,
        maxProducts: 2000,
        maxStorage: 500,
        isRecommended: true,
        features: JSON.stringify(['Todo lo del Plan Light', 'Facturación Electrónica (DTE)', 'Gestión de Clientes y Créditos', 'Cotizaciones Avanzadas', 'Soporte Prioritario WhatsApp']),
      },
      {
        id: 'plan-vanguard',
        name: 'Plan Vanguard',
        description: 'Para empresas que exigen lo mejor en análisis y control total.',
        price: 54900,
        maxUsers: 20,
        maxProducts: 10000,
        maxStorage: 2000,
        isRecommended: false,
        features: JSON.stringify(['Todo lo del Plan Elevate', 'Usuarios Ilimitados', 'Reportes de Inteligencia de Negocios', 'API de Integración', 'Consultor Dedicado']),
      },
    ];

    for (const plan of plans) {
      await client.query(`
        INSERT INTO "Plan" (id, name, description, price, "maxUsers", "maxProducts", "maxStorage", "isRecommended", features, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = $2, price = $4, "isRecommended" = $8
      `, [plan.id, plan.name, plan.description, plan.price, plan.maxUsers, plan.maxProducts, plan.maxStorage, plan.isRecommended, plan.features]);
    }
    console.log(`✅ ${plans.length} planes creados/actualizados`);

    // ── 3. TENANT DEMO ───────────────────────────────────────────────────────
    console.log('\n🏢 Creando tenant demo...');
    let tenantId;
    const existingTenant = await client.query(`SELECT id FROM "Tenant" WHERE slug = 'supermercado-demo' LIMIT 1`);
    if (existingTenant.rows.length > 0) {
      tenantId = existingTenant.rows[0].id;
      console.log(`✅ Tenant demo ya existe (id: ${tenantId})`);
    } else {
      tenantId = generateId();
      await client.query(`
        INSERT INTO "Tenant" (id, name, slug, rut, giro, status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
      `, [tenantId, 'Supermercado Demo', 'supermercado-demo', '76.123.456-7', 'Comercio al por menor de abarrotes']);
      console.log(`✅ Tenant demo creado (id: ${tenantId})`);
    }

    // ── 4. SUCURSAL ──────────────────────────────────────────────────────────
    let branchId;
    const existingBranch = await client.query(`SELECT id FROM "Branch" WHERE id = 'branch-providencia' LIMIT 1`);
    if (existingBranch.rows.length > 0) {
      branchId = 'branch-providencia';
      console.log(`✅ Sucursal ya existe`);
    } else {
      branchId = 'branch-providencia';
      await client.query(`
        INSERT INTO "Branch" (id, name, "isMain", "isActive", "tenantId", "createdAt", "updatedAt")
        VALUES ($1, $2, true, true, $3, NOW(), NOW())
      `, [branchId, 'Providencia', tenantId]);
      console.log(`✅ Sucursal Providencia creada`);
    }

    // ── 5. TENANT SETTINGS ───────────────────────────────────────────────────
    const existingSettings = await client.query(`SELECT id FROM "TenantSettings" WHERE "tenantId" = $1 LIMIT 1`, [tenantId]);
    if (existingSettings.rows.length === 0) {
      await client.query(`
        INSERT INTO "TenantSettings" ("tenantId", "enableBoletaDte", "enableFacturaDte", "enableGuiaDespachoDte", "enableNotaCreditoDte", "maxBranches", "maxRegisters", "maxUsers", "canHardDelete", "createdAt", "updatedAt")
        VALUES ($1, false, false, false, false, 1, 1, 3, false, NOW(), NOW())
      `, [tenantId]);
      console.log(`✅ TenantSettings creado`);
    }

    // ── 6. USUARIOS ──────────────────────────────────────────────────────────
    console.log('\n👤 Creando usuarios...');
    const password = await hashPassword('admin123');

    const users = [
      { email: 'superadmin@nexopos.cl', name: 'Super Administrador', role: 'SUPER_ADMIN' },
      { email: 'admin@demo.cl', name: 'Administrador Demo', role: 'TENANT_ADMIN' },
      { email: 'cajero@demo.cl', name: 'Cajero Demo', role: 'CASHIER' },
    ];

    for (const u of users) {
      const existing = await client.query(`SELECT id FROM "User" WHERE email = $1 LIMIT 1`, [u.email]);
      if (existing.rows.length > 0) {
        await client.query(`UPDATE "User" SET password = $1, role = $2, "updatedAt" = NOW() WHERE email = $3`, [password, u.role, u.email]);
        console.log(`✅ Usuario actualizado: ${u.email} (contraseña → admin123)`);
      } else {
        await client.query(`
          INSERT INTO "User" (id, email, name, password, role, "tenantId", "branchId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [u.email, u.name, password, u.role, tenantId, branchId]);
        console.log(`✅ Usuario creado: ${u.email}`);
      }
    }

    // ── RESUMEN ──────────────────────────────────────────────────────────────
    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log('   Super Admin: superadmin@nexopos.cl / admin123');
    console.log('   Admin Demo:  admin@demo.cl          / admin123');
    console.log('   Cajero Demo: cajero@demo.cl          / admin123');

  } catch (error) {
    console.error('\n❌ Error durante el seed:', error.message);
    if (error.code)   console.error('   Código:', error.code);
    if (error.detail) console.error('   Detalle:', error.detail);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
