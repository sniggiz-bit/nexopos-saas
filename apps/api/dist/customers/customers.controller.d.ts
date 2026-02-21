import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
    }>;
    findAll(tenantId?: string): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
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
        phone: string | null;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
    }) | null>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        phone: string | null;
        rut: string;
        giro: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string | null;
        comuna: string | null;
    }>;
}
