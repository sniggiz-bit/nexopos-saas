import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { EventsModule } from '../events/events.module'; // <-- Asegura la ruta relativa

@Module({
  imports: [EventsModule], // <-- AGREGA EL MODULE AQUÍ
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule { }