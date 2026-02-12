import { PrismaClient } from '@prisma/client';

// Simple initialization as it should work if schema is correctly generated
const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando Prueba de Venta con Débito ---');

    // 1. Obtener datos básicos
    const user = await prisma.user.findFirst();
    const branch = await prisma.branch.findFirst();
    const product = await prisma.product.findFirst();
    const tenant = await prisma.tenant.findFirst();

    if (!user || !branch || !product || !tenant) {
        console.error('No se encontraron datos básicos (User, Branch, Product o Tenant) para la prueba.');
        return;
    }

    console.log(`Usando: User ${user.email}, Branch ${branch.name}, Producto ${product.name}`);

    // 2. Asegurar que haya un turno abierto
    let shift = await prisma.cashShift.findFirst({
        where: { branchId: branch.id, status: 'OPEN' }
    });

    if (!shift) {
        console.log('Abriendo un nuevo turno de caja...');
        shift = await prisma.cashShift.create({
            data: {
                branchId: branch.id,
                openedBy: user.id,
                initialAmount: 10000,
                status: 'OPEN',
            }
        });
    }
    console.log(`Turno activo: ${shift.id}`);

    // 3. Simular Venta con Débito
    const totalVenta = product.price; // Vendemos 1 unidad
    console.log(`Creando venta por un total de $${totalVenta} con medio de pago DEBITO...`);

    const sale = await prisma.sale.create({
        data: {
            tenantId: tenant.id,
            branchId: branch.id,
            userId: user.id,
            cashShiftId: shift.id,
            total: totalVenta,
            items: {
                create: {
                    productId: product.id,
                    quantity: 1,
                    price: product.price,
                }
            },
            payments: {
                create: {
                    paymentMethod: 'DEBITO',
                    amount: totalVenta,
                }
            }
        },
        include: {
            payments: true
        }
    });

    console.log(`✅ Venta creada: ${sale.id}`);
    console.log('Pagos registrados:', sale.payments);

    // 4. Verificar Totales del Turno
    // (Simulamos la lógica de cierre para ver los totales actuales)
    const shiftWithSales = await prisma.cashShift.findUnique({
        where: { id: shift.id },
        include: {
            sales: {
                include: { payments: true }
            }
        }
    });

    const totalsByMethod = {
        EFECTIVO: 0,
        DEBITO: 0,
        CREDITO: 0,
        TRANSFERENCIA: 0,
    };

    shiftWithSales?.sales.forEach(s => {
        s.payments.forEach(p => {
            const method = p.paymentMethod as keyof typeof totalsByMethod;
            totalsByMethod[method] += p.amount;
        });
    });

    console.log('--- Resumen de Turno (Totales por Medio de Pago) ---');
    console.log(JSON.stringify(totalsByMethod, null, 2));

    const expected = Number(shift.initialAmount) + totalsByMethod.EFECTIVO;
    console.log(`Monto Esperado en Efectivo (Caja): $${expected}`);

    console.log('--- Prueba Finalizada ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
