"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkDteFields() {
    console.log('\n🔍 Verificando campos DTE en la última venta...\n');
    const latestSale = await prisma.sale.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });
    if (!latestSale) {
        console.log('❌ No se encontraron ventas en la base de datos');
        return;
    }
    console.log('📋 Última venta encontrada:');
    console.log(`   - ID: ${latestSale.id}`);
    console.log(`   - Total: $${latestSale.total} CLP`);
    console.log(`   - Creada: ${latestSale.createdAt}`);
    console.log('\n📄 Campos DTE:');
    console.log(`   - dteType: ${latestSale.dteType} ${latestSale.dteType === 39 ? '✅ (Boleta Electrónica)' : ''}`);
    console.log(`   - dteFolio: ${latestSale.dteFolio || 'null'} ${latestSale.dteFolio ? '✅' : '⏳ (pendiente)'}`);
    console.log(`   - dteStatus: ${latestSale.dteStatus} ${latestSale.dteStatus === 'ACEPTADO' ? '✅' : latestSale.dteStatus === 'PENDING' ? '⏳' : ''}`);
    if (latestSale.dteStatus === 'PENDING') {
        console.log('\n💡 El DTE aún está pendiente. Espera 1-2 segundos y vuelve a ejecutar este script.');
    }
    else if (latestSale.dteStatus === 'ACEPTADO') {
        console.log('\n✅ DTE emitido exitosamente!');
    }
    await prisma.$disconnect();
}
checkDteFields().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=check-dte.js.map