
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
        return this.prisma.customer.create({
            data: createCustomerDto,
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.customer.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.customer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { sales: true, quotes: true, credits: true },
                },
            },
        });
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }

    async remove(id: string) {
        return this.prisma.customer.delete({
            where: { id },
        });
    }
}
