import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { EventsModule } from '../events/events.module';
import { InternalReceiptService } from '../dte/internal-receipt.service'; // <--- LA RUTA CORREGIDA

@Module({
  imports: [EventsModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    InternalReceiptService
  ],
})
export class SalesModule { }