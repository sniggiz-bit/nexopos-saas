import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
    constructor(
        @Inject(forwardRef(() => EventsGateway))
        private readonly eventsGateway: EventsGateway,
    ) { }

    // Firma ultra-flexible para aceptar 1 o 2 argumentos de cualquier tipo
    emit(event: any, data?: any) {
        if (!this.eventsGateway?.server) return;

        if (typeof event === 'string') {
            // Patrón clásico: emit('evento', datos)
            this.eventsGateway.server.emit(event, data);
        } else if (event && typeof event === 'object') {
            // Patrón monorepo: emit({ event: 'nombre', data: {} }) o simplemente emit(objeto)
            const eventName = event.event || event.name || 'websocket_event';
            const eventData = event.data || event.payload || event;
            this.eventsGateway.server.emit(eventName, eventData);
        }
    }

    emitToAll(event: any, data?: any) {
        this.emit(event, data);
    }

    broadcast(event: any, data?: any) {
        this.emit(event, data);
    }
}