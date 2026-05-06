import { BranchesService } from './branches.service';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    create(createBranchDto: {
        name: string;
        address?: string;
        isMain?: boolean;
    }, req: any): Promise<{
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
    findAll(req: any): never[] | Promise<{
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
    updateStatus(id: string, statusDto: {
        isActive: boolean;
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
}
