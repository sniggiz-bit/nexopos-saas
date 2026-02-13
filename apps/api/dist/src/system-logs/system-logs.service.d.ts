import { PrismaService } from '../prisma/prisma.service';
export declare class SystemLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<({
        tenant: {
            name: string;
        } | null;
    } & {
        id: string;
        tenantId: string | null;
        createdAt: Date;
        level: string;
        message: string;
        context: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
}
