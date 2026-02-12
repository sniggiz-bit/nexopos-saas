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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryController = void 0;
const common_1 = require("@nestjs/common");
const treasury_service_1 = require("./treasury.service");
let TreasuryController = class TreasuryController {
    treasuryService;
    constructor(treasuryService) {
        this.treasuryService = treasuryService;
    }
    getReceivables(tenantId) {
        return this.treasuryService.getReceivables(tenantId);
    }
    getCashFlow(tenantId) {
        return this.treasuryService.getCashFlow(tenantId);
    }
    getMaturities(tenantId) {
        return this.treasuryService.getMaturities(tenantId);
    }
};
exports.TreasuryController = TreasuryController;
__decorate([
    (0, common_1.Get)('receivables'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getReceivables", null);
__decorate([
    (0, common_1.Get)('cash-flow'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getCashFlow", null);
__decorate([
    (0, common_1.Get)('maturities'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getMaturities", null);
exports.TreasuryController = TreasuryController = __decorate([
    (0, common_1.Controller)('treasury'),
    __metadata("design:paramtypes", [treasury_service_1.TreasuryService])
], TreasuryController);
//# sourceMappingURL=treasury.controller.js.map