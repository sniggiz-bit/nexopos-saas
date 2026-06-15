const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTenant(tenantId) {
  if (!tenantId) {
    console.error("Por favor, proporciona el ID del tenant. Ejemplo:\nnode delete_tenant.js <tenant-id>");
    process.exit(1);
  }

  console.log(` Iniciando eliminación completa del tenant: ${tenantId}...`);

  try {
    // Ejecutamos la eliminación en orden de dependencias dentro de una transacción
    await prisma.$transaction([
      // 1. Facturas, transacciones e integraciones
      prisma.invoice.deleteMany({ where: { tenantId } }),
      prisma.paymentTransaction.deleteMany({ where: { tenantId } }),
      prisma.ecommerceOrder.deleteMany({ where: { tenantId } }),
      prisma.ecommerceConnection.deleteMany({ where: { tenantId } }),
      prisma.tenantModuleAddon.deleteMany({ where: { tenantId } }),
      
      // 2. Movimientos y niveles de stock
      prisma.productPriceTier.deleteMany({ where: { product: { tenantId } } }),
      prisma.inventory.deleteMany({ where: { product: { tenantId } } }),
      prisma.stockMovement.deleteMany({ where: { product: { tenantId } } }),
      
      // 3. Ventas e ítems de venta
      prisma.saleItem.deleteMany({ where: { product: { tenantId } } }),
      prisma.sale.deleteMany({ where: { tenantId } }),
      
      // 4. Cotizaciones
      prisma.quoteItem.deleteMany({ where: { product: { tenantId } } }),
      prisma.quote.deleteMany({ where: { tenantId } }),
      
      // 5. Créditos y transferencias
      prisma.credit.deleteMany({ where: { tenantId } }),
      prisma.transferItem.deleteMany({ where: { product: { tenantId } } }),
      prisma.transfer.deleteMany({ where: { originBranch: { tenantId } } }),
      
      // 6. Compras y proveedores
      prisma.purchaseItem.deleteMany({ where: { product: { tenantId } } }),
      prisma.purchase.deleteMany({ where: { tenantId } }),
      prisma.supplier.deleteMany({ where: { tenantId } }),
      
      // 7. Productos, categorías y marcas
      prisma.product.deleteMany({ where: { tenantId } }),
      prisma.category.deleteMany({ where: { tenantId } }),
      prisma.brand.deleteMany({ where: { tenantId } }),
      
      // 8. Clientes, usuarios y sucursales
      prisma.customer.deleteMany({ where: { tenantId } }),
      prisma.user.deleteMany({ where: { tenantId } }),
      prisma.branch.deleteMany({ where: { tenantId } }),
      
      // 9. Logs y configuraciones del Tenant
      prisma.systemLog.deleteMany({ where: { tenantId } }),
      prisma.dteConfig.deleteMany({ where: { tenantId } }),
      
      // 10. Tenant Settings y finalmente el Tenant
      prisma.tenantSettings.deleteMany({ where: { tenantId } }),
      prisma.tenant.delete({ where: { id: tenantId } })
    ]);

    console.log(`✅ Tenant ${tenantId} y todos sus datos asociados fueron eliminados correctamente.`);
  } catch (error) {
    console.error("❌ Error al eliminar el tenant:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTenant(process.argv[2]);
