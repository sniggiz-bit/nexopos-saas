import { PrismaService } from '../prisma/prisma.service';
interface CreateTransferItemDto {
    productId: string;
    quantity: number;
}
interface CreateTransferDto {
    originBranchId: string;
    destBranchId: string;
    items: CreateTransferItemDto[];
    note?: string;
    userId: string;
}
export declare class TransfersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateTransferDto): Promise<any>;
}
export {};
