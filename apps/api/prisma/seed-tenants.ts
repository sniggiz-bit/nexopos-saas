import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting Tenant Seeding...');

    // 1. Create Plans
    console.log('📋 Creating Plans...');

    const planBasic = await prisma.plan.create({
        data: {
            name: 'Plan Básico',
            price: 0,
            maxUsers: 2,
            maxProducts: 100,
            maxStorage: 50, // MB
        },
    });

    const planPyme = await prisma.plan.create({
        data: {
            name: 'Plan Pyme',
            price: 15000,
            maxUsers: 5,
            maxProducts: 1000,
            maxStorage: 500, // MB
        },
    });

    const planEnterprise = await prisma.plan.create({
        data: {
            name: 'Plan Enterprise',
            price: 50000,
            maxUsers: 100,
            maxProducts: 10000,
            maxStorage: 5000, // MB
        },
    });

    console.log('✅ Plans Created:', [planBasic.name, planPyme.name, planEnterprise.name]);

    // 2. Create Tenants
    const tenantsData = [
        { name: 'Botillería El Cielo', plan: planBasic, status: 'ACTIVE', expired: false },
        { name: 'Minimarket Don Tito', plan: planPyme, status: 'ACTIVE', expired: false },
        { name: 'Panadería La Espiga', plan: planEnterprise, status: 'ACTIVE', expired: false },
        { name: 'Ferretería Norte', plan: planPyme, status: 'SUSPENDED', expired: false },
        { name: 'Sushi Delivery', plan: planBasic, status: 'ACTIVE', expired: true },
    ];

    for (const t of tenantsData) {
        console.log(`🏢 Creating Tenant: ${t.name}...`);

        const tenant = await prisma.tenant.create({
            data: {
                name: t.name,
                status: t.status,
                planId: t.plan.id,
                nextPayment: t.expired
                    ? new Date(new Date().setDate(new Date().getDate() - 5)) // 5 days ago
                    : new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
                maxUsers: t.plan.maxUsers,
                maxProducts: t.plan.maxProducts,
            },
        });

        // 3. Create Admin User for Tenant
        const emailDomain = t.name.toLowerCase().replace(/\s+/g, '').replace(/ñ/g, 'n').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u') + '.cl';
        const email = `contacto@${emailDomain}`;
        // Assuming '123456' hashed
        const hashedPassword = await bcrypt.hash('123456', 10);

        await prisma.user.create({
            data: {
                email: email,
                name: `Admin ${t.name}`,
                password: hashedPassword,
                role: UserRole.ADMIN, // Assuming ADMIN is the tenant admin
                tenantId: tenant.id,
            },
        });

        console.log(`   👤 User Created: ${email} (Password: 123456)`);
    }

    console.log('🎉 Seeding Completed Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
