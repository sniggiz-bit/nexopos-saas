/**
 * Script de Prueba: DTE Integration Test
 * 
 * Este script prueba que el DTE se emite correctamente después de una venta.
 * Espera 2 segundos después de la venta para verificar que el DTE fue procesado.
 */

import 'dotenv/config';

const API_URL = 'http://localhost:3000';

interface SaleItem {
    productId: string;
    quantity: number;
}

interface CreateSaleRequest {
    tenantId: string;
    branchId: string;
    userId?: string;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'DEBIT';
    items: SaleItem[];
}

async function testDteEmission() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🧪 Test: Emisión de DTE (Boleta Electrónica)');
    console.log('═══════════════════════════════════════════════════════\n');

    const saleData: CreateSaleRequest = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        paymentMethod: 'CASH',
        items: [
            { productId: 'prod-1', quantity: 1 }
        ]
    };

    try {
        // Step 1: Create sale
        console.log('📝 Paso 1: Creando venta...\n');
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
        console.log(`   - ID: ${sale.id}`);
        console.log(`   - Total: $${sale.total} CLP`);
        console.log(`   - Método de pago: ${sale.paymentMethod}\n`);

        // Step 2: Check initial DTE fields
        console.log('📄 Campos DTE (inmediatamente después de la venta):');
        console.log(`   - dteType: ${sale.dteType} ${sale.dteType === 39 ? '✅ (Boleta Electrónica)' : '❌'}`);
        console.log(`   - dteFolio: ${sale.dteFolio || 'null'} ${sale.dteFolio ? '✅' : '⏳ (pendiente)'}`);
        console.log(`   - dteStatus: ${sale.dteStatus} ${sale.dteStatus === 'PENDING' ? '⏳' : sale.dteStatus === 'ACEPTADO' ? '✅' : '❌'}\n`);

        // Step 3: Wait for DTE service to process (1 second delay + buffer)
        console.log('⏳ Esperando 2 segundos para que el DTE se procese...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Fetch the sale again to check updated DTE fields
        console.log('🔍 Paso 2: Verificando estado del DTE...\n');
        const checkResponse = await fetch(`${API_URL}/sales/${sale.id}`);

        if (!checkResponse.ok) {
            console.log('⚠️  No se pudo verificar el DTE (endpoint GET no implementado)');
            console.log('💡 Verifica manualmente en Prisma Studio (puerto 5555):\n');
            console.log('   1. Abre la tabla "Sale"');
            console.log(`   2. Busca la venta con ID: ${sale.id}`);
            console.log('   3. Verifica que:');
            console.log('      - dteType = 39');
            console.log('      - dteFolio tiene un número (ej: 5001-9999)');
            console.log('      - dteStatus = "ACEPTADO"\n');
            return;
        }

        const updatedSale = await checkResponse.json();

        console.log('📄 Campos DTE (después de 2 segundos):');
        console.log(`   - dteType: ${updatedSale.dteType} ${updatedSale.dteType === 39 ? '✅' : '❌'}`);
        console.log(`   - dteFolio: ${updatedSale.dteFolio || 'null'} ${updatedSale.dteFolio ? '✅' : '❌'}`);
        console.log(`   - dteStatus: ${updatedSale.dteStatus} ${updatedSale.dteStatus === 'ACEPTADO' ? '✅' : '❌'}\n`);

        // Validation
        if (updatedSale.dteType === 39 && updatedSale.dteFolio && updatedSale.dteStatus === 'ACEPTADO') {
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ TEST PASADO - DTE emitido correctamente!');
            console.log('═══════════════════════════════════════════════════════\n');
            console.log(`📋 Resumen:`);
            console.log(`   - Folio asignado: ${updatedSale.dteFolio}`);
            console.log(`   - Estado: ${updatedSale.dteStatus}`);
            console.log(`   - Tipo: ${updatedSale.dteType} (Boleta Electrónica)\n`);
        } else {
            console.log('❌ TEST FALLIDO - El DTE no se emitió correctamente');
            console.log('   Verifica los logs del servidor para más detalles.\n');
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}

testDteEmission().catch(console.error);
