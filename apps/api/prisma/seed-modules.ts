import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Iniciando carga de módulos extra...');
    const modulesData = [
      { code: 'POS', name: 'Punto de Venta', description: 'Sistema principal de caja y ventas', price: 10000 },
      { code: 'QUOTES', name: 'Cotizaciones', description: 'Emisión y seguimiento de cotizaciones', price: 5000 },
      { code: 'CUSTOMERS', name: 'Clientes', description: 'Gestión y fidelización de clientes', price: 5000 },
      { code: 'EXTRA_BRANCH', name: 'Sucursal Adicional', description: 'Gestión de múltiples puntos de venta', price: 15000 },
      { code: 'ECOMMERCE', name: 'Tienda en Línea', description: 'Catálogo público y ventas web nativas', price: 20000 },
      { code: 'SHOPIFY', name: 'Integración Shopify', description: 'Sincronización de productos e inventario', price: 15000 },
      { code: 'WOOCOMMERCE', name: 'Integración WooCommerce', description: 'Sincronización de productos e inventario', price: 15000 },
      { code: 'TRANSBANK', name: 'Integración Transbank', description: 'Cobros electrónicos con Webpay/POS', price: 10000 },
      { code: 'CREDITS', name: 'Créditos', description: 'Ventas a crédito y líneas de crédito', price: 8000 },
      { code: 'DTE_BOLETA', name: 'Boletas Electrónicas', description: 'Emisión de boletas afectas/exentas al SII', price: 12000 },
      { code: 'DTE_FACTURA', name: 'Facturas Electrónicas', description: 'Emisión de facturas electrónicas al SII', price: 12000 },
      { code: 'DTE_NOTA_CREDITO', name: 'Notas de Crédito', description: 'Anulación y corrección de DTEs', price: 5000 },
      { code: 'DTE_GUIA_DESPACHO', name: 'Guías de Despacho', description: 'Emisión de guías de traslado', price: 5000 }
    ];

    for (const mod of modulesData) {
        await prisma.module.upsert({
            where: { code: mod.code },
            update: { price: mod.price }, // Update price if it exists
            create: mod,
        });
    }
    console.log('✅ Módulos extra cargados/actualizados (13).');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
