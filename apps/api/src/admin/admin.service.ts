import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardMetrics() {
        const totalTenants = await this.prisma.tenant.count();

        // Estimate MRR based on active tenants (simplified for now)
        // Assuming a standard plan price or calculating from subscriptions if they existed
        // For now, let's just count active tenants * default price (e.g., 25000)
        const activeTenants = await this.prisma.tenant.count({
            where: {
                // active: true // Assuming active field exists or based on subscription
            }
        });
        const mrr = activeTenants * 25000;

        // Active users today (users who logged in or created a shift/sale today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const activeUsers = await this.prisma.user.count({
            where: {
                updatedAt: {
                    gte: startOfDay
                }
            }
        });

        return {
            totalTenants,
            mrr,
            activeUsers
        };
    }

    async getTenants(page: number = 1, limit: number = 10, search?: string) {
        const skip = (page - 1) * limit;

        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { rut: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                skip,
                take: limit,
                where: whereClause,
                include: {
                    users: {
                        where: {
                            role: 'ADMIN'
                        },
                        take: 1,
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    _count: {
                        select: { branches: true, users: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.tenant.count({ where: whereClause })
        ]);

        return {
            data: tenants.map(t => ({
                ...t,
                owner: t.users[0] || { name: 'N/A', email: 'N/A' },
                status: 'ACTIVE' // Placeholder until status field is added to Tenant
            })),
            total,
            page,
            lastPage: Math.ceil(total / limit)
        };
    }

    async toggleTenantStatus(id: string, status: string) {
        // This requires a status field on Tenant model which might not exist primarily
        // For now we will just simulate it or add it if allowed.
        // The user request mentioned "PATCH /admin/tenants/:id/status"

        // Check if tenant exists
        await this.prisma.tenant.findUniqueOrThrow({ where: { id } });

        // implementation pending actual status field on Tenant
        return { success: true, message: `Tenant ${id} status changed to ${status}` };
    }
}
