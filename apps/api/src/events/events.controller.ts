import {
  Controller,
  Get,
  Query,
  Sse,
  UnauthorizedException,
  MessageEvent,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventsService } from './events.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * SSE stream endpoint. EventSource cannot set Authorization headers,
   * so the JWT token is accepted as a query parameter.
   * The stream only emits event-type notifications (no sensitive data),
   * and all actual data fetches go through authenticated REST endpoints.
   */
  @Public()
  @Sse('stream')
  stream(
    @Query('tenantId') tenantId: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    if (!token || !tenantId) {
      throw new UnauthorizedException('token and tenantId are required');
    }

    try {
      const payload = this.jwtService.verify(token) as { tenantId?: string };

      if (payload.tenantId !== tenantId) {
        throw new UnauthorizedException('Tenant mismatch');
      }
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return this.eventsService.getEventsForTenant(tenantId).pipe(
      map((event) => ({ data: event } as MessageEvent)),
    );
  }

  /**
   * Health check — useful for confirming the SSE endpoint is reachable.
   */
  @Public()
  @Get('ping')
  ping() {
    return { ok: true };
  }
}
