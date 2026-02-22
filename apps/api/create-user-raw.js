const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = "postgresql://postgres:postgres@nexopos-postgres:5432/nexopos?schema=public";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function main() {
  console.log('🌱 Creando usuarios vía SQL puro...');

  const hp = await bcrypt.hash('nexopos2026', 10);

  try {
    // 1. Crear Tenant si no existe
    await pool.query(`
      INSERT INTO "Tenant" (id, name, slug, status, "updatedAt")
      VALUES ('tenant-1', 'NexoPOS Oficial', 'nexopos-oficial', 'ACTIVE', NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'NexoPOS Oficial'
    `);
    console.log('✅ Tenant listo');

    // 2. Crear Branch si no existe
    await pool.query(`
      INSERT INTO "Branch" (id, name, "tenantId", "updatedAt")
      VALUES ('branch-1', 'Casa Matriz', 'tenant-1', NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'Casa Matriz'
    `);
    console.log('✅ Branch listo');

    // 3. Crear Usuario ventas@nexopos.cl
    await pool.query(`
      INSERT INTO "User" (id, email, name, password, role, "tenantId", "branchId", "updatedAt")
      VALUES ('user-ventas', 'ventas@nexopos.cl', 'Cajero Nexo', $1, 'CASHIER', 'tenant-1', 'branch-1', NOW())
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'CASHIER'
    `, [hp]);
    console.log('✅ ventas@nexopos.cl listo');

    // 4. Crear Usuario gestion@nexopos.cl (Administrador del Cliente/Tenant)
    await pool.query(`
      INSERT INTO "User" (id, email, name, password, role, "tenantId", "branchId", "updatedAt")
      VALUES ('user-gestion', 'gestion@nexopos.cl', 'Admin Cliente Nexo', $1, 'ADMIN', 'tenant-1', 'branch-1', NOW())
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'ADMIN'
    `, [hp]);
    console.log('✅ gestion@nexopos.cl listo');

    // 5. Crear Usuario admin@nexopos.cl
    await pool.query(`
      INSERT INTO "User" (id, email, name, password, role, "tenantId", "updatedAt")
      VALUES ('user-admin', 'admin@nexopos.cl', 'Admin Nexo', $1, 'SUPER_ADMIN', 'tenant-1', NOW())
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'SUPER_ADMIN'
    `, [hp]);
    console.log('✅ admin@nexopos.cl listo');

  } catch (err) {
    console.error('❌ Error ejecutando SQL:', err.message);
  } finally {
    await pool.end();
  }
}

main();
