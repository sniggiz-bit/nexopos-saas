const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  { code: 'DTE_GUIA_DESPACHO', name: 'Guías de Despacho', description: 'Emisión de guías de traslado' }
];

async function main() {
  for (const mod of modules) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: {},
      create: mod
    });
  }
  console.log('Módulos insertados exitosamente.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
