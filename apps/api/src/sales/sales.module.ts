import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { EventsModule } from '../events/events.module';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreditsService } from '../credits/credits.service';
import { DteService } from '../dte/dte.service'; // <--- AGREGADO
import { InventoryService } from '../inventory/inventory.service'; // <--- AGREGADO

@Module({
  imports: [EventsModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    InternalReceiptService,
    CreditsService,
    DteService, // <--- INYECTADO CON COMA
    InventoryService // <--- INYECTADO
  ],
  exports: [SalesService]
})
export class SalesModule { }