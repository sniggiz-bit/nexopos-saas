import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  emit(event: any) {
    if (this.eventsGateway && this.eventsGateway.server) {
      this.eventsGateway.server.emit(event.type, event.payload);
    }
  }
}
