import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';
export declare class PlansService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<Plan>;
    findAll(): Promise<Plan[]>;
    findOne(id: string): Promise<Plan | null>;
    update(id: string, data: any): Promise<Plan>;
    remove(id: string): Promise<Plan>;
    findPublic(): Promise<Plan[]>;
}
