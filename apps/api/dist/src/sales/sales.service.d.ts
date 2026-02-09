import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private prisma;
    constructor(prisma: PrismaService);
    createSale(createSaleDto: CreateSaleDto): Promise<any>;
}
