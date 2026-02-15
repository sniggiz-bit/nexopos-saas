import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { CreditsModule } from '../credits/credits.module';

import { ShiftsModule } from '../shifts/shifts.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [PrismaModule, ReceiptsModule, ShiftsModule, CreditsModule, InventoryModule],
    controllers: [SalesController],
    providers: [SalesService],
    exports: [SalesService],
})
export class SalesModule { }
