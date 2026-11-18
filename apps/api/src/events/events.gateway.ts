import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { canJoinEventsRoom } from './event-room-access';

export interface InventoryUpdatePayload {
  productId: string;
  newStock: number;
}

/**
 * EventsGateway — Socket.IO WebSocket gateway.
 * Broadcasts real-time events (inventory updates, sales, etc.)
 * to all connected clients in the same tenant room.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService, private readonly events: EventsService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token || client.handshake.query?.token) as string;
      const tenantId = (client.handshake.auth?.tenantId || client.handshake.query?.tenantId) as string;

      if (!tenantId) {
        this.logger.warn(
          `Connection rejected: Missing tenantId. Socket ID: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      let payload: { tenantId?: string; sub?: string; role?: string } | null = null;
      if (token && token !== 'anonymous' && token !== 'null') {
        const signed = this.jwtService.verify(token);
        const user = typeof signed.sub === 'string' ? await this.prisma.user.findUnique({ where: { id: signed.sub }, include: { tenant: { select: { status: true } } } }) : null;
        if (!signed.role || !user || !user.isActive || user.tenantId !== signed.tenantId || user.tokenVersion !== (signed.tokenVersion ?? 0) || (user.role !== 'SUPER_ADMIN' && user.tenant.status !== 'ACTIVE')) throw new Error('Session revoked');
        payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
        client.data.userId = user.id;
        await client.join('account_user:' + user.id);
        await client.join('account_tenant:' + user.tenantId);
      }
      if (!canJoinEventsRoom(tenantId, payload)) {
        this.logger.warn(`Connection rejected: Room access denied. Socket ID: ${client.id}`);
        client.disconnect();
        return;
      }

      // Store tenantId in socket metadata and join tenant room
      client.data = client.data || {};
      client.data.tenantId = tenantId;
      await client.join(tenantId);
      this.logger.log(`Client ${client.id} joined room ${tenantId}`);
    } catch (err) {
      this.logger.warn(
        `Connection rejected: Invalid token. Socket ID: ${client.id}. Error: ${err.message}`,
      );
      client.disconnect();
    }
  }

  revokeUser(userId: string) {
    this.events.revokeUser(userId);
    this.server?.in('account_user:' + userId).disconnectSockets(true);
  }
  revokeTenant(tenantId: string) {
    this.events.revokeTenant(tenantId);
    this.server?.in('account_tenant:' + tenantId).disconnectSockets(true);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emits an `inventory_updated` event to clients in the specified tenant room.
   * Called after a sale, purchase, adjustment, or transfer completes.
   */
  emitInventoryUpdated(tenantId: string, payload: InventoryUpdatePayload[]): void {
    if (this.server) {
      this.server.to(tenantId).emit('inventory_updated', payload);
      this.logger.debug(
        `Emitted inventory_updated for ${payload.length} product(s) to tenant ${tenantId}`,
      );
    }
  }

  /**
   * Emits a generic named event to clients in the specified tenant room.
   */
  emitToTenant(tenantId: string, event: string, data: any): void {
    if (this.server) {
      this.server.to(tenantId).emit(event, data);
      this.logger.debug(
        `Emitted event '${event}' to tenant ${tenantId}`,
      );
    }
  }
}
