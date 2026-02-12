import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(this.pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Expose Prisma client methods
  get client() {
    return this.prisma;
  }

  // Proxy common methods for convenience
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get product() {
    return this.prisma.product;
  }

  get inventoryLevel() {
    return this.prisma.inventoryLevel;
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
}
