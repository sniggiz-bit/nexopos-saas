"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function testProductsEndpoint() {
    const baseUrl = 'http://localhost:3000';
    console.log('🧪 Probando endpoint GET /products...\n');
    try {
        const response = await fetch(`${baseUrl}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        console.log('✅ Endpoint funcionando correctamente!\n');
        console.log('📦 Productos encontrados:', products.length);
        console.log('\n📋 Detalles de productos:\n');
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Precio: $${product.price.toLocaleString('es-CL')}`);
            console.log(`   Stock: ${product.stock} unidades`);
            console.log(`   SKU: ${product.sku || 'N/A'}`);
            console.log('');
        });
        console.log('✅ Prueba completada exitosamente!');
    }
    catch (error) {
        console.error('❌ Error al probar el endpoint:', error);
        process.exit(1);
    }
}
testProductsEndpoint();
//# sourceMappingURL=test-products.js.map