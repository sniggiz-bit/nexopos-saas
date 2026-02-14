import { TenantsService } from './tenants.service';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    findAll(search?: string): Promise<{
        name: string;
        id: string;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    } | null>;
    updateLimits(id: string, body: {
        maxUsers?: number;
        maxProducts?: number;
    }): Promise<{
        name: string;
        id: string;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }>;
    suspend(id: string): Promise<{
        name: string;
        id: string;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }>;
    activate(id: string): Promise<{
        name: string;
        id: string;
        rut: string | null;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        planId: string | null;
        status: string;
        nextPayment: Date | null;
        maxUsers: number | null;
        maxProducts: number | null;
    }>;
}
