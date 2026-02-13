import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAdmin() {
    console.log('🔍 Checking Super Admin...');
    const email = 'admin@nexopos-saas.cl';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.password ? user.password.substring(0, 10) + '...' : 'NULL'
    });

    if (!user.password) {
        console.error('❌ Password is null!');
        return;
    }

    const testPass = 'supersecretpassword';
    const isHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$'); // bcrypt check

    console.log(`🔐 Stored password format: ${isHash ? 'Hashed (Bcrypt)' : 'Plain Text'}`);

    if (isHash) {
        const match = await bcrypt.compare(testPass, user.password);
        console.log(`🧪 Password '${testPass}' match: ${match ? '✅ YES' : '❌ NO'}`);
    } else {
        const match = user.password === testPass;
        console.log(`🧪 Password '${testPass}' match (plain): ${match ? '✅ YES' : '❌ NO'}`);
    }

    await prisma.$disconnect();
}

checkAdmin().catch(console.error);
