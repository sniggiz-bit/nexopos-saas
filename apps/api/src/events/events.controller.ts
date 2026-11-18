import { Controller, Get, Query, Sse, UnauthorizedException, MessageEvent } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, interval, merge, of, from } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { EventsService } from './events.service';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService, private jwt: JwtService, private prisma: PrismaService) {}
  private async allowed(payload: any, tenantId: string) {
    const user = typeof payload.sub === 'string' ? await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { tenant: { select: { status: true, billingStatus: true } } } }) : null;
    return !!user && !!payload.role && user.isActive && user.tenantId === tenantId &&
      user.tokenVersion === (payload.tokenVersion ?? 0) && (user.role === 'SUPER_ADMIN' || user.tenant.status === 'ACTIVE' && user.tenant.billingStatus === 'ACTIVE');
  }
  @Public()
  @Sse('stream')
  async stream(@Query('tenantId') tenantId: string, @Query('token') token: string): Promise<Observable<MessageEvent>> {
    if (!token || !tenantId) throw new UnauthorizedException();
    let payload: any;
    try { payload = this.jwt.verify(token); } catch { throw new UnauthorizedException(); }
    if (payload.tenantId !== tenantId || !await this.allowed(payload, tenantId)) throw new UnauthorizedException('La sesión ya no es válida.');
    const recheck = interval(15000).pipe(switchMap(() => from(this.allowed(payload, tenantId)).pipe(catchError(() => of(false)))), filter(allowed => !allowed));
    return this.eventsService.getEventsForTenant(tenantId).pipe(
      takeUntil(merge(this.eventsService.getSessionRevocations(payload.sub, tenantId), recheck)),
      map(event => ({ data: event } as MessageEvent)),
    );
  }
  @Public()
  @Get('ping')
  ping() { return { ok: true }; }
}
