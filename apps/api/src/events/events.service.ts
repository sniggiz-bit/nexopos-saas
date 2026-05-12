import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
    constructor(
        @Inject(forwardRef(() => EventsGateway))
        private readonly eventsGateway: EventsGateway,
    ) { }

    // Método genérico de emisión por si sales/transfers usan .emit()
    emit(event: string, data: any) {
        if (this.eventsGateway?.server) {
            this.eventsGateway.server.emit(event, data);
        }
    }

    // Por si acaso usan .emitToAll()
    emitToAll(event: string, data: any) {
        this.emit(event, data);
    }

    // Por si acaso usan .broadcast()
    broadcast(event: string, data: any) {
        this.emit(event, data);
    }
}