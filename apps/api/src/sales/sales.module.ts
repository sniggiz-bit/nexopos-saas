import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { EventsModule } from '../events/events.module'; // <-- Asegura la ruta relativa

@Module({
  imports: [EventsModule], // <-- AGREGA EL MODULE AQUÍ
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule { }
