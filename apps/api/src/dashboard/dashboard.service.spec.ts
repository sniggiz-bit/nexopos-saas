import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      count: jest.fn(),
    },
    sale: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    supplier: {
      count: jest.fn(),
    },
    branch: {
      count: jest.fn(),
    },
    customer: {
      count: jest.fn(),
    },
    quote: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should aggregate and count statistics correctly', async () => {
      mockPrismaService.product.count.mockResolvedValue(100);
      mockPrismaService.sale.aggregate
        .mockResolvedValueOnce({ _sum: { total: 50000 } }) // salesToday
        .mockResolvedValueOnce({ _sum: { total: 1500000 } }); // monthRevenue
      mockPrismaService.$queryRaw.mockResolvedValue([{ count: 12 }]); // lowStockCount
      mockPrismaService.supplier.count.mockResolvedValue(10);
      mockPrismaService.branch.count.mockResolvedValue(3);
      mockPrismaService.customer.count.mockResolvedValue(45);
      mockPrismaService.quote.count.mockResolvedValue(8);

      const stats = await service.getStats('tenant-1', 'branch-1');

      expect(stats).toEqual({
        totalProducts: 100,
        totalSuppliers: 10,
        totalBranches: 3,
        totalCustomers: 45,
        totalQuotes: 8,
        salesToday: 50000,
        monthRevenue: 1500000,
        lowStockCount: 12,
      });

      expect(mockPrismaService.product.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isActive: true },
      });
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    it('should calculate analytics, group hourly sales, and format top products', async () => {
      // Mock hourly sales
      const now = new Date();
      const sale1 = { createdAt: new Date(now.setHours(9, 0, 0, 0)), total: 20000 };
      const sale2 = { createdAt: new Date(now.setHours(14, 30, 0, 0)), total: 35000 };
      mockPrismaService.sale.findMany.mockResolvedValue([sale1, sale2]);

      // Mock top products query raw SQL response
      const topProductsMock = [
        { id: 'p1', name: 'Product 1', qty: 15, revenue: 150000 },
        { id: 'p2', name: 'Product 2', qty: 8, revenue: 64000 },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(topProductsMock);

      // Mock month comparisons aggregates
      mockPrismaService.sale.aggregate
        .mockResolvedValueOnce({ _sum: { total: 1200000 } }) // current month
        .mockResolvedValueOnce({ _sum: { total: 800000 } }); // prev month

      const analytics = await service.getAnalytics('tenant-1', 'branch-1');

      // Verify hourly grouping
      expect(analytics.salesByHour[9].total).toBe(20000);
      expect(analytics.salesByHour[14].total).toBe(35000);
      expect(analytics.salesByHour[0].total).toBe(0);

      // Verify top products
      expect(analytics.topProducts).toEqual(topProductsMock);

      // Verify month comparison & pctChange
      expect(analytics.monthComparison).toEqual({
        currentRevenue: 1200000,
        prevRevenue: 800000,
        pctChange: 50, // ((1200000 - 800000) / 800000) * 100
      });
    });
  });
});
