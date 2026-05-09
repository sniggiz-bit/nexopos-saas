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
var PullOrdersJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PullOrdersJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const order_sync_service_1 = require("../services/order-sync.service");
let PullOrdersJob = PullOrdersJob_1 = class PullOrdersJob {
    orderSyncService;
    logger = new common_1.Logger(PullOrdersJob_1.name);
    constructor(orderSyncService) {
        this.orderSyncService = orderSyncService;
    }
    async run() {
        this.logger.log('Running scheduled order pull');
        await this.orderSyncService.pullAllActiveConnections();
    }
};
exports.PullOrdersJob = PullOrdersJob;
__decorate([
    (0, schedule_1.Cron)('0 */5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PullOrdersJob.prototype, "run", null);
exports.PullOrdersJob = PullOrdersJob = PullOrdersJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [order_sync_service_1.OrderSyncService])
], PullOrdersJob);
//# sourceMappingURL=pull-orders.job.js.map