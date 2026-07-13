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

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token || client.handshake.query?.token) as string;
      const tenantId = (client.handshake.auth?.tenantId || client.handshake.query?.tenantId) as string;

      if (!token || !tenantId) {
        this.logger.warn(
          `Connection rejected: Missing token or tenantId. Socket ID: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token) as { tenantId?: string; role?: string };

      if (payload.tenantId !== tenantId && payload.role !== 'SUPERADMIN' && tenantId !== 'superadmin') {
        this.logger.warn(
          `Connection rejected: Tenant mismatch. Socket ID: ${client.id}`,
        );
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
