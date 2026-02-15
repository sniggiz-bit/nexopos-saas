import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const email = 'admin@nexopos.cl';
    const pass = '1234';

    console.log(`Testing validation for ${email} with password ${pass}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('❌ User NOT found in database.');
            return;
        }

        console.log(`✅ User found. Role: ${user.role}, Tenant: ${user.tenantId}`);
        console.log(`Stored password snippet: ${user.password?.substring(0, 10)}...`);

        if (!user.password) {
            console.log('❌ User has no password set.');
            return;
        }

        const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
        console.log(`Is hashed: ${isHashed}`);

        if (isHashed) {
            const isMatch = await bcrypt.compare(pass, user.password);
            console.log(`Password match (hashed): ${isMatch}`);
        } else {
            const isMatch = user.password === pass;
            console.log(`Password match (plain): ${isMatch}`);
        }

    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
