import { PrismaService } from '../prisma/prisma.service';
export declare class DebugController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProducts(): Promise<{
        count: number;
        items: {
            id: string;
            name: string;
            tenantId: string;
            tenantName: string;
            inventory: {
                id: string;
                updatedAt: Date;
                minStock: number;
                branchId: string;
                productId: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
            }[];
        }[];
    }>;
}
