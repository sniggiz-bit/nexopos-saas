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
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        isMain: boolean;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        isMain: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        isMain: boolean;
    } | null>;
}
