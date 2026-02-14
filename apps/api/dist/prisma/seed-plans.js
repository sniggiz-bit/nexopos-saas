"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
require("dotenv/config");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Poblando planes dinámicos...');
    const plans = [
        {
            id: 'plan-light',
            name: 'Plan Light',
            description: 'Ideal para pequeños negocios y emprendedores que están comenzando.',
            price: 29900,
            maxUsers: 2,
            maxProducts: 500,
            maxStorage: 100,
            isRecommended: false,
            features: [
                'Multisucursal (Hasta 2)',
                'Venta Rápida POS',
                'Control de Inventario Básico',
                'Reportes Diarios',
                'Soporte por Email'
            ]
        },
        {
            id: 'plan-elevate',
            name: 'Plan Elevate',
            description: 'El equilibrio perfecto entre potencia y flexibilidad para negocios en crecimiento.',
            price: 45900,
            maxUsers: 5,
            maxProducts: 2000,
            maxStorage: 500,
            isRecommended: true,
            features: [
                'Todo lo del Plan Light',
                'Facturación Electrónica (DTE)',
                'Gestión de Clientes y Créditos',
                'Cotizaciones Avanzadas',
                'Soporte Prioritario WhatsApp'
            ]
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
            features: [
                'Todo lo del Plan Elevate',
                'Usuarios Ilimitados',
                'Reportes de Inteligencia de Negocios',
                'API de Integración',
                'Consultor Dedicado'
            ]
        }
    ];
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { id: plan.id },
            update: {
                ...plan,
                features: plan.features
            },
            create: {
                ...plan,
                features: plan.features
            }
        });
    }
    console.log('✅ Planes creados exitosamente');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed-plans.js.map