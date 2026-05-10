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

@Controller('events')
export class EventsController {
  private readonly jwtService: JwtService;

  constructor(private readonly eventsService: EventsService) {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'secretKey',
    });
  }

  /**
   * SSE stream endpoint. EventSource cannot set Authorization headers,
   * so the JWT token is accepted as a query parameter.
   * The stream only emits event-type notifications (no sensitive data),
   * and all actual data fetches go through authenticated REST endpoints.
   */
  @Sse('stream')
  stream(
    @Query('tenantId') tenantId: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    if (!token || !tenantId) {
      throw new UnauthorizedException('token and tenantId are required');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      }) as { tenantId?: string };

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
  @Get('ping')
  ping() {
    return { ok: true };
  }
}
