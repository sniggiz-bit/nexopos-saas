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
        isActive: boolean;
        tenantId: string;
        transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        isActive: boolean;
        tenantId: string;
        transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        isActive: boolean;
        tenantId: string;
        transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
    } | null>;
    findAllSystemWide(): Promise<({
        tenant: {
            name: string;
            id: string;
        };
    } & {
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        isActive: boolean;
        tenantId: string;
        transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
    updateStatus(id: string, isActive: boolean): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        isMain: boolean;
        isActive: boolean;
        tenantId: string;
        transbankSettings: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
