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
var SyncInventoryJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncInventoryJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const inventory_sync_service_1 = require("../services/inventory-sync.service");
let SyncInventoryJob = SyncInventoryJob_1 = class SyncInventoryJob {
    inventorySyncService;
    logger = new common_1.Logger(SyncInventoryJob_1.name);
    constructor(inventorySyncService) {
        this.inventorySyncService = inventorySyncService;
    }
    async run() {
        this.logger.log('Running scheduled inventory sync');
        await this.inventorySyncService.syncAllActiveConnections();
    }
};
exports.SyncInventoryJob = SyncInventoryJob;
__decorate([
    (0, schedule_1.Cron)('0 */15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncInventoryJob.prototype, "run", null);
exports.SyncInventoryJob = SyncInventoryJob = SyncInventoryJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_sync_service_1.InventorySyncService])
], SyncInventoryJob);
//# sourceMappingURL=sync-inventory.job.js.map