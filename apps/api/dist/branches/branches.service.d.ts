import { PrismaService } from '../prisma/prisma.service';
export declare class BranchesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        address?: string;
        isMain?: boolean;
        tenantId: string;
    }): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        tenantId: string;
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        tenantId: string;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        tenantId: string;
    } | null>;
}
