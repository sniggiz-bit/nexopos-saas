import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
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

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emits an `inventory_updated` event to all connected clients.
   * Called after a sale, purchase, adjustment, or transfer completes.
   */
  emitInventoryUpdated(payload: InventoryUpdatePayload[]): void {
    if (this.server) {
      this.server.emit('inventory_updated', payload);
      this.logger.debug(
        `Emitted inventory_updated for ${payload.length} product(s)`,
      );
    }
  }

  /**
   * Emits a generic named event to all connected clients.
   */
  emitToAll(event: string, data: any): void {
    if (this.server) {
      this.server.emit(event, data);
    }
  }
}
