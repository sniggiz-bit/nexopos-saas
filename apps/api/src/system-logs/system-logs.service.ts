import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemLogsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: any) {
        const { tenantId, level } = query;
        return this.prisma.systemLog.findMany({
            where: {
                ...(tenantId && { tenantId }),
                ...(level && { level }),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { tenant: { select: { name: true } } },
        });
    }
}
