
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@Injectable()
export class CreditsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCreditDto: CreateCreditDto) {
        return this.prisma.credit.create({
            data: createCreditDto,
        });
    }

    async findAll(tenantId: string, customerId?: string) {
        const where: any = { tenantId };
        if (customerId) {
            where.customerId = customerId;
        }

        return this.prisma.credit.findMany({
            where,
            include: {
                customer: true,
                sale: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const credit = await this.prisma.credit.findUnique({
            where: { id },
            include: {
                customer: true,
                sale: true,
                payments: true,
            },
        });

        if (!credit) {
            throw new NotFoundException(`Credit with ID ${id} not found`);
        }

        return credit;
    }

    async addPayment(id: string, addPaymentDto: AddPaymentDto) {
        const { amount, paymentMethod, cashShiftId } = addPaymentDto;

        const credit = await this.findOne(id);

        if (credit.status === 'PAID') {
            throw new BadRequestException('Credit is already paid');
        }

        if (amount > credit.balance) {
            throw new BadRequestException('Payment amount exceeds balance');
        }

        const newBalance = credit.balance - amount;
        const status = newBalance <= 0 ? 'PAID' : 'OPEN';

        return this.prisma.$transaction(async (prisma) => {
            // Create payment record
            await prisma.creditPayment.create({
                data: {
                    creditId: id,
                    amount,
                    paymentMethod,
                    cashShiftId,
                }
            });

            // Update credit balance and status
            return prisma.credit.update({
                where: { id },
                data: {
                    balance: newBalance,
                    status,
                },
                include: {
                    payments: true,
                }
            });
        });
    }
}
