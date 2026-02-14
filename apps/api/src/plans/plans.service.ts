import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class PlansService {
    constructor(private prisma: PrismaService) { }

    async create(data: any): Promise<Plan> {
        return this.prisma.plan.create({ data });
    }

    async findAll(): Promise<Plan[]> {
        return this.prisma.plan.findMany();
    }

    async findOne(id: string): Promise<Plan | null> {
        return this.prisma.plan.findUnique({ where: { id } });
    }

    async update(id: string, data: any): Promise<Plan> {
        return this.prisma.plan.update({ where: { id }, data });
    }

    async remove(id: string): Promise<Plan> {
        return this.prisma.plan.delete({ where: { id } });
    }

    async findPublic(): Promise<Plan[]> {
        return this.prisma.plan.findMany({
            where: { isVisible: true },
            orderBy: { price: 'asc' }
        });
    }
}
