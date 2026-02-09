"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const API_URL = 'http://localhost:3000';
async function testSuccessfulSale() {
    console.log('🧪 Test 1: Venta Exitosa (2 unidades de prod-1)\n');
    const saleData = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        paymentMethod: 'CASH',
        items: [
            { productId: 'prod-1', quantity: 2 }
        ]
    };
    try {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
        });
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error en la venta:', error);
            return;
        }
        const sale = await response.json();
        console.log('✅ Venta creada exitosamente!');
        console.log('📋 Detalles de la venta:');
        console.log(`   - ID: ${sale.id}`);
        console.log(`   - Total: $${sale.total} CLP`);
        console.log(`   - Método de pago: ${sale.paymentMethod}`);
        console.log(`   - Sucursal: ${sale.branch.name}`);
        console.log(`   - Items vendidos: ${sale.items.length}`);
        sale.items.forEach((item, index) => {
            console.log(`\n   Item ${index + 1}:`);
            console.log(`     - Producto: ${item.product.name}`);
            console.log(`     - Cantidad: ${item.quantity}`);
            console.log(`     - Precio unitario: $${item.price} CLP`);
            console.log(`     - Subtotal: $${item.price * item.quantity} CLP`);
        });
        console.log('\n✅ Test 1 PASADO\n');
        console.log('💡 Verifica en Prisma Studio que:');
        console.log('   - El inventario de prod-1 disminuyó en 2 unidades');
        console.log('   - Se creó un registro en la tabla Sale');
        console.log('   - Se crearon los SaleItem correspondientes\n');
    }
    catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}
async function testInsufficientStock() {
    console.log('🧪 Test 2: Stock Insuficiente (intentar comprar 200 unidades)\n');
    const saleData = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        paymentMethod: 'CASH',
        items: [
            { productId: 'prod-1', quantity: 200 }
        ]
    };
    try {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
        });
        if (!response.ok) {
            const error = await response.json();
            console.log('✅ Error esperado recibido:');
            console.log(`   - Status: ${response.status}`);
            console.log(`   - Mensaje: ${error.message}`);
            console.log('\n✅ Test 2 PASADO (validación de stock funcionando)\n');
        }
        else {
            console.error('❌ Test 2 FALLIDO: Debería haber rechazado la venta por stock insuficiente\n');
        }
    }
    catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}
async function testInvalidProduct() {
    console.log('🧪 Test 3: Producto Inválido (producto inexistente)\n');
    const saleData = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        paymentMethod: 'CASH',
        items: [
            { productId: 'prod-999', quantity: 1 }
        ]
    };
    try {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
        });
        if (!response.ok) {
            const error = await response.json();
            console.log('✅ Error esperado recibido:');
            console.log(`   - Status: ${response.status}`);
            console.log(`   - Mensaje: ${error.message}`);
            console.log('\n✅ Test 3 PASADO (validación de producto funcionando)\n');
        }
        else {
            console.error('❌ Test 3 FALLIDO: Debería haber rechazado la venta por producto inválido\n');
        }
    }
    catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 Pruebas de Venta Transaccional (ACID)');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('⚠️  Asegúrate de que:');
    console.log('   1. El servidor API esté corriendo (npm run start:dev)');
    console.log('   2. La base de datos tenga los datos del seed\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testSuccessfulSale();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testInsufficientStock();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testInvalidProduct();
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Todas las pruebas completadas');
    console.log('═══════════════════════════════════════════════════════');
}
main().catch(console.error);
//# sourceMappingURL=test-sale.js.map