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
    console.log('Buscando tu negocio original...');
    
    // Buscar todos los negocios y ordenarlos por cantidad de productos
    const tenants = await prisma.tenant.findMany({
        include: { _count: { select: { products: true } }, branches: true }
    });
    
    // Ordenar de mayor a menor según cantidad de productos
    tenants.sort((a, b) => b._count.products - a._count.products);
    
    const realTenant = tenants[0];
    
    if (!realTenant) {
        console.log('No se encontraron negocios en la base de datos.');
        return;
    }

    console.log(`✅ Encontrado: "${realTenant.name}" con ${realTenant._count.products} productos.`);
    
    const branch = realTenant.branches.find(b => b.isMain) || realTenant.branches[0];

    if (!branch) {
        console.log('El negocio no tiene sucursales.');
        return;
    }

    // Devolver los usuarios principales a este negocio
    await prisma.user.updateMany({
        where: { 
            email: { 
                in: ['superadmin@nexopos.cl', 'admin@demo.cl'] 
            } 
        },
        data: {
            tenantId: realTenant.id,
            branchId: branch.id
        }
    });

    console.log(`✅ ¡Éxito! Tu usuario Administrador fue movido de regreso a "${realTenant.name}".`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
