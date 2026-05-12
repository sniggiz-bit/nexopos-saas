import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { EventsModule } from '../events/events.module'; // <-- Ajusta la ruta relativa si es necesario

@Module({
  imports: [EventsModule], // <-- AGREGA EL MODULE AQUÍ
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule { }
