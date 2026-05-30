import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let jwtService: JwtService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    let mockSocket: Partial<Socket> & { disconnect: jest.Mock; join: jest.Mock; data: any; handshake: any };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-123',
        handshake: {
          auth: {},
          query: {},
        },
        disconnect: jest.fn(),
        join: jest.fn().mockResolvedValue(undefined),
        data: {},
      };
    });

    it('should reject connection if token is missing', async () => {
      mockSocket.handshake.auth.tenantId = 'tenant-1';
      
      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should reject connection if tenantId is missing', async () => {
      mockSocket.handshake.auth.token = 'valid-token';

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should reject connection if token verification throws an error', async () => {
      mockSocket.handshake.auth.token = 'invalid-token';
      mockSocket.handshake.auth.tenantId = 'tenant-1';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should reject connection if tenantId in token does not match client tenantId', async () => {
      mockSocket.handshake.auth.token = 'token-tenant-2';
      mockSocket.handshake.auth.tenantId = 'tenant-1';
      mockJwtService.verify.mockReturnValue({ tenantId: 'tenant-2' });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should accept connection and join room if token and tenantId match', async () => {
      mockSocket.handshake.auth.token = 'token-tenant-1';
      mockSocket.handshake.auth.tenantId = 'tenant-1';
      mockJwtService.verify.mockReturnValue({ tenantId: 'tenant-1' });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.join).toHaveBeenCalledWith('tenant-1');
      expect(mockSocket.data.tenantId).toBe('tenant-1');
    });

    it('should support checking token and tenantId from query params', async () => {
      mockSocket.handshake.query.token = 'query-token';
      mockSocket.handshake.query.tenantId = 'tenant-3';
      mockJwtService.verify.mockReturnValue({ tenantId: 'tenant-3' });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.join).toHaveBeenCalledWith('tenant-3');
      expect(mockSocket.data.tenantId).toBe('tenant-3');
    });
  });

  describe('emissions', () => {
    let mockServer: Partial<Server> & { to: jest.Mock };
    let mockEmit: jest.Mock;

    beforeEach(() => {
      mockEmit = jest.fn();
      mockServer = {
        to: jest.fn().mockReturnValue({ emit: mockEmit }),
      };
      gateway.server = mockServer as any;
    });

    it('emitInventoryUpdated should emit to tenant room only', () => {
      const payload = [{ productId: 'p1', newStock: 10 }];
      
      gateway.emitInventoryUpdated('tenant-abc', payload);

      expect(mockServer.to).toHaveBeenCalledWith('tenant-abc');
      expect(mockEmit).toHaveBeenCalledWith('inventory_updated', payload);
    });

    it('emitToTenant should emit custom event to tenant room only', () => {
      const customData = { msg: 'hello' };

      gateway.emitToTenant('tenant-xyz', 'custom_event', customData);

      expect(mockServer.to).toHaveBeenCalledWith('tenant-xyz');
      expect(mockEmit).toHaveBeenCalledWith('custom_event', customData);
    });
  });
});
