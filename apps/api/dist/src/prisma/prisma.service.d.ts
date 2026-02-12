import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private pool;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get client(): PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
    get $transaction(): any;
    get product(): import("@prisma/client").Prisma.ProductDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get inventoryLevel(): import("@prisma/client").Prisma.InventoryLevelDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get sale(): import("@prisma/client").Prisma.SaleDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get saleItem(): import("@prisma/client").Prisma.SaleItemDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get tenant(): import("@prisma/client").Prisma.TenantDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get branch(): import("@prisma/client").Prisma.BranchDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get user(): import("@prisma/client").Prisma.UserDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get category(): import("@prisma/client").Prisma.CategoryDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get brand(): import("@prisma/client").Prisma.BrandDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get dteConfig(): import("@prisma/client").Prisma.DteConfigDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get cashShift(): import("@prisma/client").Prisma.CashShiftDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get customer(): import("@prisma/client").Prisma.CustomerDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get quote(): import("@prisma/client").Prisma.QuoteDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get credit(): import("@prisma/client").Prisma.CreditDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    get creditPayment(): import("@prisma/client").Prisma.CreditPaymentDelegate<import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
