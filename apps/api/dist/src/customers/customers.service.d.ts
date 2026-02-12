import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createCustomerDto: CreateCustomerDto): Promise<{
        name: string;
        id: string;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
        phone: string | null;
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        id: string;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
        phone: string | null;
    }[]>;
    findOne(id: string): Promise<({
        _count: {
            sales: number;
            quotes: number;
            credits: number;
        };
    } & {
        name: string;
        id: string;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
        phone: string | null;
    }) | null>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<{
        name: string;
        id: string;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
        phone: string | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
        phone: string | null;
    }>;
}
