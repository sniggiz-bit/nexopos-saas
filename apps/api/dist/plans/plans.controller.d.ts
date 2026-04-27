import { PlansService } from './plans.service';
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    findPublic(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxProducts: number;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }[]>;
    create(createPlanDto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxProducts: number;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }>;
    findAll(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxProducts: number;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxProducts: number;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    } | null>;
    update(id: string, updatePlanDto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxProducts: number;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        description: string | null;
        maxUsers: number;
        features: import("@prisma/client/runtime/client").JsonValue | null;
        maxProducts: number;
        maxStorage: number;
        isRecommended: boolean;
        isVisible: boolean;
    }>;
}
