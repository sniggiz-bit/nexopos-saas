import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.logger.log(`Connecting to database via pg adapter...`);
    this.pool = new Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    this.prisma = new PrismaClient({ adapter } as any);
  }

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    await this.pool.end();
  }

  // Expose Prisma client methods
  get client() {
    return this.prisma;
  }

  // Proxy common methods for convenience
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get $queryRaw() {
    return this.prisma.$queryRaw.bind(this.prisma);
  }

  get $executeRaw() {
    return this.prisma.$executeRaw.bind(this.prisma);
  }

  get product() {
    return this.prisma.product;
  }

  get inventory() {
    return this.prisma.inventory;
  }

  get sale() {
    return this.prisma.sale;
  }

  get saleItem() {
    return this.prisma.saleItem;
  }

  get tenant() {
    return this.prisma.tenant;
  }

  get branch() {
    return this.prisma.branch;
  }

  get user() {
    return this.prisma.user;
  }

  get category() {
    return this.prisma.category;
  }

  get brand() {
    return this.prisma.brand;
  }

  get supplier() {
    return this.prisma.supplier;
  }

  get purchase() {
    return this.prisma.purchase;
  }

  get purchaseItem() {
    return this.prisma.purchaseItem;
  }

  get kardex() {
    return this.prisma.kardex;
  }

  get cashShift() {
    return this.prisma.cashShift;
  }

  get cashShiftExpense() {
    return this.prisma.cashShiftExpense;
  }

  get quote() {
    return this.prisma.quote;
  }

  get quoteItem() {
    return this.prisma.quoteItem;
  }

  get plan() {
    return this.prisma.plan;
  }

  get module() {
    return this.prisma.module;
  }

  get planModule() {
    return this.prisma.planModule;
  }

  get tenantModuleAddon() {
    return this.prisma.tenantModuleAddon;
  }

  get notification() {
    return this.prisma.notification;
  }

  get billing() {
    return this.prisma.billing;
  }

  get paymentTransaction() {
    return this.prisma.paymentTransaction;
  }

  get ecommerceIntegration() {
    return (this.prisma as any).ecommerceIntegration;
  }

  get productGalleryImage() {
    return (this.prisma as any).productGalleryImage;
  }

  get productSupplier() {
    return (this.prisma as any).productSupplier;
  }

  get liveChat() {
    return (this.prisma as any).liveChat;
  }

  get liveChatMessage() {
    return (this.prisma as any).liveChatMessage;
  }
}
