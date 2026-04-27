import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
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
}
