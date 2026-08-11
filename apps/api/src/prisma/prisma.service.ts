import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// pg types are not in devDependencies, use require to avoid compile error
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg');

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pool: any;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.pool = new Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    this.prisma = new PrismaClient({ adapter } as any);
  }

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log('Database connection established via pg adapter');
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

  get dteConfig() {
    return this.prisma.dteConfig;
  }

  get cashShift() {
    return this.prisma.cashShift;
  }

  get customer() {
    return this.prisma.customer;
  }

  get quote() {
    return this.prisma.quote;
  }

  get credit() {
    return this.prisma.credit;
  }

  get creditPayment() {
    return this.prisma.creditPayment;
  }

  get payment() {
    return this.prisma.payment;
  }

  get stockMovement() {
    return this.prisma.stockMovement;
  }

  get quoteItem() {
    return this.prisma.quoteItem;
  }

  get plan() {
    return this.prisma.plan;
  }

  get systemLog() {
    return this.prisma.systemLog;
  }

  get announcement() {
    return this.prisma.announcement;
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

  get transfer() {
    return this.prisma.transfer;
  }

  get transferItem() {
    return this.prisma.transferItem;
  }

  get paymentTransaction() {
    return this.prisma.paymentTransaction;
  }

  get ecommerceConnection() {
    return this.prisma.ecommerceConnection;
  }

  get productMapping() {
    return this.prisma.productMapping;
  }

  get registeredWebhook() {
    return this.prisma.registeredWebhook;
  }

  get ecommerceOrder() {
    return this.prisma.ecommerceOrder;
  }

  get syncLog() {
    return this.prisma.syncLog;
  }

  get tenantSettings() {
    return this.prisma.tenantSettings;
  }

  get landingConfig() {
    return this.prisma.landingConfig;
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

  get invoice() {
    return this.prisma.invoice;
  }

  get systemNotification() {
    return this.prisma.systemNotification;
  }

  get chatSession() {
    return this.prisma.chatSession;
  }

  get chatMessage() {
    return this.prisma.chatMessage;
  }
}
