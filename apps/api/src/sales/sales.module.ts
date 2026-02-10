import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
    imports: [PrismaModule, ReceiptsModule],
    controllers: [SalesController],
    providers: [SalesService],
})
export class SalesModule { }
