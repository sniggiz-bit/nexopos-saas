import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

/**
 * EventsModule — bundles the WebSocket gateway and the in-process
 * event bus so that any module can import it and use either class.
 *
 * Usage in other modules:
 *   imports: [EventsModule]
 *   providers: auto-resolved via exports below
 */
@Module({
  providers: [EventsGateway, EventsService],
  exports: [EventsGateway, EventsService],
})
export class EventsModule {}
