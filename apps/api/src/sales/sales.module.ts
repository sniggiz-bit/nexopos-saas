import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { EventsModule } from '../events/events.module';

// 1. Importamos los MÓDULOS reales, no los servicios sueltos
import { InventoryModule } from '../inventory/inventory.module';
import { DteModule } from '../dte/dte.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    EventsModule,
    InventoryModule, // <-- Conecta el ecosistema real de Inventario
    DteModule,       // <-- Conecta el ecosistema real de Facturación
    CreditsModule    // <-- Conecta el ecosistema real de Créditos
  ],
  controllers: [SalesController],
  providers: [
    SalesService // <-- AHORA SOLO QUEDA VENTAS AQUÍ
  ],
  exports: [SalesService]
})
export class SalesModule { }