import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { TransfersService } from './src/transfers/transfers.service';

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5434/nexopos?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const service = new TransfersService(prisma as any, { emit: () => {} } as any);

async function main() {
    console.log("Fetching branches and products for test...");
    const branches = await prisma.branch.findMany({ take: 2 });
    const product = await prisma.product.findFirst();
    const user = await prisma.user.findFirst();

    if (!branches[0] || !branches[1] || !product || !user) {
        throw new Error("Missing data in DB");
    }

    console.log("Attempting direct transfer service call...");
    try {
        const transfer = await service.create({
            originBranchId: branches[0].id,
            destBranchId: branches[1].id,
            items: [{ productId: product.id, quantity: 1 }],
            note: "Direct test",
            userId: user.id
        });
        console.log("Success:", transfer);
    } catch (e) {
        console.error("Direct Service Error:", e);
    }
}

main().finally(() => prisma.$disconnect());
