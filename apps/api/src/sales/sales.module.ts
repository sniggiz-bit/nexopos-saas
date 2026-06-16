import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { EventsModule } from '../events/events.module';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreditsService } from '../credits/credits.service';
import { DteService } from '../dte/dte.service';
import { InventoryService } from '../inventory/inventory.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EventsModule, EmailModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    InternalReceiptService,
    CreditsService,
    DteService,
    InventoryService
  ],
  exports: [SalesService]
})
export class SalesModule { }