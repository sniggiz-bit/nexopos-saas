"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    }
    async onModuleInit() {
        await this.prisma.$connect();
    }
    async onModuleDestroy() {
        await this.prisma.$disconnect();
    }
    get client() {
        return this.prisma;
    }
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
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map