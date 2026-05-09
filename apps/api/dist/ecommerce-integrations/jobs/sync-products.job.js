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
var SyncProductsJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncProductsJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const product_sync_service_1 = require("../services/product-sync.service");
let SyncProductsJob = SyncProductsJob_1 = class SyncProductsJob {
    productSyncService;
    logger = new common_1.Logger(SyncProductsJob_1.name);
    constructor(productSyncService) {
        this.productSyncService = productSyncService;
    }
    async run() {
        this.logger.log('Running scheduled product sync');
        await this.productSyncService.syncAllActiveConnections();
    }
};
exports.SyncProductsJob = SyncProductsJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncProductsJob.prototype, "run", null);
exports.SyncProductsJob = SyncProductsJob = SyncProductsJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_sync_service_1.ProductSyncService])
], SyncProductsJob);
//# sourceMappingURL=sync-products.job.js.map