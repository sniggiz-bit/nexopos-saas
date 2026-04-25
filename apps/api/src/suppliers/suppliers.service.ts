import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatRut } from '@nexopos/shared';

interface CreateSupplierDto {
    name: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface UpdateSupplierDto {
    name?: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
}

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.supplier.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: {
                purchases: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        date: true,
                        totalAmount: true,
                        status: true,
                    },
                },
            },
        });

        if (!supplier) {
            throw new NotFoundException(`Supplier with id ${id} not found`);
        }

        if (supplier.tenantId !== tenantId) {
            throw new ForbiddenException('Access denied');
        }

        return supplier;
    }

    async create(data: CreateSupplierDto, tenantId: string) {
        return this.prisma.supplier.create({
            data: {
                ...data,
                rut: data.rut ? formatRut(data.rut) : undefined,
                tenantId,
            },
        });
    }

    async update(id: string, data: UpdateSupplierDto, tenantId: string) {
        await this.findOne(id, tenantId); // validates ownership

        const updateData = { ...data };
        if (updateData.rut) updateData.rut = formatRut(updateData.rut);

        return this.prisma.supplier.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId); // validates ownership

        return this.prisma.supplier.delete({
            where: { id },
        });
    }
}
