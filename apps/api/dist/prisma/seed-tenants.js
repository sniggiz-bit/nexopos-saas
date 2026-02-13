"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Starting Tenant Seeding...');
    console.log('📋 Creating Plans...');
    const planBasic = await prisma.plan.create({
        data: {
            name: 'Plan Básico',
            price: 0,
            maxUsers: 2,
            maxProducts: 100,
            maxStorage: 50,
        },
    });
    const planPyme = await prisma.plan.create({
        data: {
            name: 'Plan Pyme',
            price: 15000,
            maxUsers: 5,
            maxProducts: 1000,
            maxStorage: 500,
        },
    });
    const planEnterprise = await prisma.plan.create({
        data: {
            name: 'Plan Enterprise',
            price: 50000,
            maxUsers: 100,
            maxProducts: 10000,
            maxStorage: 5000,
        },
    });
    console.log('✅ Plans Created:', [planBasic.name, planPyme.name, planEnterprise.name]);
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
                    ? new Date(new Date().setDate(new Date().getDate() - 5))
                    : new Date(new Date().setDate(new Date().getDate() + 30)),
                maxUsers: t.plan.maxUsers,
                maxProducts: t.plan.maxProducts,
            },
        });
        const emailDomain = t.name.toLowerCase().replace(/\s+/g, '').replace(/ñ/g, 'n').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u') + '.cl';
        const email = `contacto@${emailDomain}`;
        const hashedPassword = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: {
                email: email,
                name: `Admin ${t.name}`,
                password: hashedPassword,
                role: client_1.UserRole.ADMIN,
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
//# sourceMappingURL=seed-tenants.js.map