import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { DteService } from '../dte/dte.service';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { CreditsService } from '../credits/credits.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventsService } from '../events/events.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SalesService (Tenant Isolation on Payments & DTE)', () => {
  let service: SalesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sale: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      createMany: jest.fn(),
    },
    credit: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockDteService = {
    emitirDte: jest.fn(),
  };

  const mockInternalReceiptService = {};
  const mockCreditsService = {};
  const mockInventoryService = {};
  const mockEventsService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DteService, useValue: mockDteService },
        { provide: InternalReceiptService, useValue: mockInternalReceiptService },
        { provide: CreditsService, useValue: mockCreditsService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('completePreSale', () => {
    it('should throw NotFoundException if sale does not belong to tenant', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue(null); // Sale not found or mismatch tenantId

      await expect(service.completePreSale('sale-123', 'tenant-1', [])).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.sale.findFirst).toHaveBeenCalledWith({
        where: { id: 'sale-123', tenantId: 'tenant-1' },
        include: { items: true },
      });
    });

    it('should proceed and complete pre-sale if sale belongs to tenant', async () => {
      const saleMock = {
        id: 'sale-123',
        tenantId: 'tenant-1',
        status: 'PRE_SALE',
        total: 5000,
        customerId: 'customer-1',
      };
      mockPrismaService.sale.findFirst
        .mockResolvedValueOnce(saleMock) // Initial lookup
        .mockResolvedValueOnce({ ...saleMock, status: 'COMPLETED' }); // Final return lookup
      mockPrismaService.payment.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.sale.update.mockResolvedValue({ ...saleMock, status: 'COMPLETED' });

      const res = await service.completePreSale('sale-123', 'tenant-1', [
        { amount: 5000, paymentMethod: 'CASH' as any },
      ]);

      expect(res?.status).toBe('COMPLETED');
      expect(mockPrismaService.sale.findFirst).toHaveBeenCalledWith({
        where: { id: 'sale-123', tenantId: 'tenant-1' },
        include: { items: true },
      });
    });
  });

  describe('emitirNotaCreditoForSale', () => {
    it('should throw NotFoundException if sale does not belong to tenant on NC emission', async () => {
      mockPrismaService.sale.findFirst.mockResolvedValue(null);

      await expect(service.emitirNotaCreditoForSale('sale-123', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should update sale and invoke DteService if sale belongs to tenant', async () => {
      const saleMock = {
        id: 'sale-123',
        tenantId: 'tenant-1',
        status: 'COMPLETED',
      };
      mockPrismaService.sale.findFirst.mockResolvedValue(saleMock);
      mockPrismaService.sale.update.mockResolvedValue(saleMock);
      mockDteService.emitirDte.mockResolvedValue({ ok: true });

      await service.emitirNotaCreditoForSale('sale-123', 'tenant-1');

      expect(mockPrismaService.sale.update).toHaveBeenCalledWith({
        where: { id: 'sale-123' },
        data: { dteType: 61, dteStatus: 'PENDING' },
      });
      expect(mockDteService.emitirDte).toHaveBeenCalledWith('sale-123');
    });
  });
});
