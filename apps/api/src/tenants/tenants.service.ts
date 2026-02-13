import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<Tenant[]> {
        return this.prisma.tenant.findMany({
            include: {
                plan: true,
                users: {
                    where: { role: 'ADMIN' },
                    take: 1,
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: { users: true, branches: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string): Promise<Tenant | null> {
        return this.prisma.tenant.findUnique({
            where: { id },
            include: { plan: true, branches: true, users: true }
        });
    }

    async updateLimits(id: string, limits: { maxUsers?: number; maxProducts?: number }) {
        return this.prisma.tenant.update({
            where: { id },
            data: limits
        });
    }

    async suspend(id: string) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status: 'SUSPENDED' }
        });
    }

    async activate(id: string) {
        return this.prisma.tenant.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });
    }
}
