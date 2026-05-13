import { Injectable } from '@nestjs/common';

export interface AppEvent {
  type: string;
  tenantId: string;
  branchId?: string;
  payload?: Record<string, any>;
}

/**
 * EventsService — lightweight in-process event bus.
 * Emits structured events that other services (WebSocket gateway,
 * audit logs, etc.) can consume.  Currently acts as a thin wrapper
 * so that dependent code compiles and runs; extend with an EventEmitter
 * or message broker as needed.
 */
@Injectable()
export class EventsService {
  emit(event: AppEvent): void {
    // Placeholder: log to console in dev; wire to a real bus in production.
    console.log(`[EventsService] ${event.type}`, {
      tenantId: event.tenantId,
      branchId: event.branchId,
      payload: event.payload,
    });
  }
}
