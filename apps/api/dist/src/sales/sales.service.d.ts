import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private prisma;
    private dteService;
    constructor(prisma: PrismaService, dteService: DteService);
    createSale(createSaleDto: CreateSaleDto): Promise<any>;
}
