import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Module({
    providers: [EventsGateway, EventsService],
    exports: [EventsGateway, EventsService], // <-- EXPORTAR AMBOS AQUÍ
})
export class EventsModule { }