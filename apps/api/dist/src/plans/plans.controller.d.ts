import { PlansService } from './plans.service';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findPublic(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        maxProducts: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }[]>;
    create(createPlanDto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        maxProducts: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        maxProducts: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        maxProducts: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    } | null>;
    update(id: string, updatePlanDto: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        maxProducts: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        maxProducts: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }>;
}
