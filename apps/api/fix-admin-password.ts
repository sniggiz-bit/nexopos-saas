import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/nexopos?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    // Listar todos los usuarios
    const users = await prisma.user.findMany({
        select: { email: true, role: true, password: true, name: true },
    });

    console.log('\n📋 Usuarios en la base de datos:');
    for (const u of users) {
        const passInfo = u.password
            ? (u.password.startsWith('$2b$') || u.password.startsWith('$2a$') ? 'bcrypt hash' : `texto plano: "${u.password}"`)
            : 'SIN CONTRASEÑA';
        console.log(`  - ${u.email} (${u.role ?? 'sin rol'}) → ${passInfo}`);
    }

    // Actualizar / crear el superadmin con contraseña correcta
    const newPassword = 'Admin1234!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const adminEmail = 'admin@nexopos-saas.cl';
    const existingAdmin = users.find(u => u.email === adminEmail);

    if (existingAdmin) {
        await prisma.user.update({
            where: { email: adminEmail },
            data: { password: hashedPassword },
        });
        console.log(`\n✅ Contraseña actualizada para: ${adminEmail}`);
    } else {
        console.log(`\n⚠️  Usuario ${adminEmail} no encontrado.`);
        // Mostrar qué usuarios existen con rol SUPER_ADMIN
        const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
        if (superAdmins.length > 0) {
            console.log('  Super Admins encontrados:');
            for (const sa of superAdmins) {
                await prisma.user.update({
                    where: { email: sa.email },
                    data: { password: hashedPassword },
                });
                console.log(`  ✅ Contraseña actualizada para: ${sa.email}`);
            }
        }
    }

    console.log(`\n🔑 Nueva contraseña: ${newPassword}`);
    console.log('   Ya puedes iniciar sesión.\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
