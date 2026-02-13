import { PlansService } from './plans.service';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    create(createPlanDto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        maxUsers: number;
        maxProducts: number;
        maxStorage: number;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        maxUsers: number;
        maxProducts: number;
        maxStorage: number;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        maxUsers: number;
        maxProducts: number;
        maxStorage: number;
    } | null>;
    update(id: string, updatePlanDto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        maxUsers: number;
        maxProducts: number;
        maxStorage: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        maxUsers: number;
        maxProducts: number;
        maxStorage: number;
    }>;
}
