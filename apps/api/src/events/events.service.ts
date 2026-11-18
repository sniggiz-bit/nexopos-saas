import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export type StoreEventType =
  | 'sale.created'
  | 'purchase.created'
  | 'transfer.created'
  | 'inventory.adjusted'
  | 'stock.updated';

export interface StoreEvent {
  type: StoreEventType;
  tenantId: string;
  branchId?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class EventsService implements OnModuleDestroy {
  private readonly revoked$ = new Subject<{ userId?: string; tenantId?: string }>();
  private readonly events$ = new Subject<StoreEvent>();

  revokeUser(userId: string) { this.revoked$.next({ userId }); }
  revokeTenant(tenantId: string) { this.revoked$.next({ tenantId }); }
  getSessionRevocations(userId: string, tenantId: string) { return this.revoked$.pipe(filter(e => e.userId === userId || e.tenantId === tenantId)); }

  emit(event: StoreEvent): void {
    this.events$.next(event);
  }

  getEventsForTenant(tenantId: string) {
    return this.events$.pipe(filter((e) => e.tenantId === tenantId));
  }

  onModuleDestroy() {
    this.events$.complete();
    this.revoked$.complete();
  }
}
