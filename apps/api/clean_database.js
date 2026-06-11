const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ID del tenant que queremos conservar (Supermercado Demo, que contiene al Superadmin y a los usuarios Demo)
const KEEP_TENANT_ID = 'adc33582-d102-410c-9bbb-a29a4352ac45';

async function main() {
  console.log(`🧹 Iniciando limpieza de base de datos...`);
  console.log(`Conservando el tenant Demo: ${KEEP_TENANT_ID}`);

  try {
    // 1. Obtener todos los tenants registrados
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true }
    });

    // 2. Filtrar cuáles vamos a eliminar (todos menos el Demo)
    const tenantsToDelete = tenants.filter(t => t.id !== KEEP_TENANT_ID);
    
    if (tenantsToDelete.length === 0) {
      console.log("No hay otros tenants para eliminar. La base de datos ya está limpia.");
      return;
    }

    console.log(`Se eliminarán ${tenantsToDelete.length} tenants y todos sus datos relacionados:`);
    console.log(tenantsToDelete.map(t => `- ${t.name} (${t.id})`).join('\n'));

    // 3. Ejecutar borrado en cascada para cada uno en una transacción segura
    for (const t of tenantsToDelete) {
      console.log(`\nEliminando datos del tenant: ${t.name}...`);
      await prisma.$transaction([
        // 1. Logs de sincronización de e-commerce
        prisma.syncLog.deleteMany({ where: { tenantId: t.id } }),
        
        // 2. Pagos de ventas
        prisma.payment.deleteMany({ where: { sale: { tenantId: t.id } } }),
        
        // 3. Ítems de venta
        prisma.saleItem.deleteMany({ where: { product: { tenantId: t.id } } }),
        
        // 4. Ventas
        prisma.sale.deleteMany({ where: { tenantId: t.id } }),
        
        // 5. Pagos de créditos
        prisma.creditPayment.deleteMany({ where: { credit: { tenantId: t.id } } }),
        
        // 6. Créditos
        prisma.credit.deleteMany({ where: { tenantId: t.id } }),
        
        // 7. Turnos de caja (CashShifts)
        prisma.cashShift.deleteMany({ where: { branch: { tenantId: t.id } } }),
        
        // 8. Ítems de transferencias
        prisma.transferItem.deleteMany({ where: { product: { tenantId: t.id } } }),
        
        // 9. Transferencias
        prisma.transfer.deleteMany({ where: { originBranch: { tenantId: t.id } } }),
        
        // 10. Compras (PurchaseItem se elimina por onDelete: Cascade en Purchase)
        prisma.purchase.deleteMany({ where: { tenantId: t.id } }),
        
        // 11. Proveedores
        prisma.supplier.deleteMany({ where: { tenantId: t.id } }),
        
        // 12. Precios por volumen (ProductPriceTier)
        prisma.productPriceTier.deleteMany({ where: { product: { tenantId: t.id } } }),
        
        // 13. Niveles de inventario (Inventory)
        prisma.inventory.deleteMany({ where: { product: { tenantId: t.id } } }),
        
        // 14. Movimientos de stock
        prisma.stockMovement.deleteMany({ where: { product: { tenantId: t.id } } }),
        
        // 15. Ítems de cotizaciones
        prisma.quoteItem.deleteMany({ where: { product: { tenantId: t.id } } }),
        
        // 16. Cotizaciones
        prisma.quote.deleteMany({ where: { tenantId: t.id } }),
        
        // 17. Productos
        prisma.product.deleteMany({ where: { tenantId: t.id } }),
        
        // 18. Categorías
        prisma.category.deleteMany({ where: { tenantId: t.id } }),
        
        // 19. Marcas
        prisma.brand.deleteMany({ where: { tenantId: t.id } }),
        
        // 20. Clientes
        prisma.customer.deleteMany({ where: { tenantId: t.id } }),
        
        // 21. Usuarios
        prisma.user.deleteMany({ where: { tenantId: t.id } }),
        
        // 22. Sucursales (Branches)
        prisma.branch.deleteMany({ where: { tenantId: t.id } }),
        
        // 23. Facturas de suscripción
        prisma.invoice.deleteMany({ where: { tenantId: t.id } }),
        
        // 24. Transacciones de Transbank
        prisma.paymentTransaction.deleteMany({ where: { tenantId: t.id } }),
        
        // 25. Órdenes de e-commerce
        prisma.ecommerceOrder.deleteMany({ where: { tenantId: t.id } }),
        
        // 26. Conexiones de e-commerce
        prisma.ecommerceConnection.deleteMany({ where: { tenantId: t.id } }),
        
        // 27. Módulos / Addons del tenant
        prisma.tenantModuleAddon.deleteMany({ where: { tenantId: t.id } }),
        
        // 28. Logs de sistema
        prisma.systemLog.deleteMany({ where: { tenantId: t.id } }),
        
        // 29. Configuración DTE
        prisma.dteConfig.deleteMany({ where: { tenantId: t.id } }),
        
        // 30. Ajustes del tenant
        prisma.tenantSettings.deleteMany({ where: { tenantId: t.id } }),
        
        // 31. El Tenant
        prisma.tenant.delete({ where: { id: t.id } })
      ]);
      console.log(`✅ Eliminado con éxito: ${t.name}`);
    }

    console.log("\n🎉 ¡Limpieza de base de datos completada exitosamente!");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
