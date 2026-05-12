import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { EventsModule } from '../events/events.module';
import { InternalReceiptService } from '../receipts/internal-receipt.service'; // <--- Importamos el servicio rebelde

@Module({
  imports: [EventsModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    InternalReceiptService // <--- ¡AQUÍ ESTÁ LA PIEZA QUE FALTABA!
  ],
})
export class SalesModule { }