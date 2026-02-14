import { BranchesService } from './branches.service';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    create(createBranchDto: {
        name: string;
        address?: string;
        isMain?: boolean;
    }, req: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        isMain: boolean;
    }>;
    findAll(req: any): never[] | Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        isMain: boolean;
    }[]>;
}
