import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Global() // <--- ¡ESTA ES LA MAGIA! Lo hace visible en todo NexoPOS sin importar el módulo
@Module({
    providers: [EventsGateway, EventsService],
    exports: [EventsGateway, EventsService],
})
export class EventsModule { }