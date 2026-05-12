import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['https://nexopos.cl', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitInventoryUpdated(payload: { productId: string; newStock: number }[]) {
    try {
      if (this.server) {
        this.server.emit('inventory_updated', payload);
        this.logger.log(
          `Emitted inventory_updated with ${payload.length} items`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to emit inventory_updated: ${error.message}`);
    }
  }
}
