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
exports.TransbankController = void 0;
const common_1 = require("@nestjs/common");
const transbank_service_1 = require("./transbank.service");
const record_transaction_dto_1 = require("./dto/record-transaction.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TransbankController = class TransbankController {
    transbankService;
    constructor(transbankService) {
        this.transbankService = transbankService;
    }
    recordTransaction(dto) {
        return this.transbankService.recordTransaction(dto);
    }
    findByOrderId(orderId) {
        return this.transbankService.findByOrderId(orderId);
    }
    findByTenant(tenantId) {
        return this.transbankService.findByTenant(tenantId);
    }
    linkToSale(body) {
        return this.transbankService.linkToSale(body.orderId, body.saleId);
    }
    getConfig(branchId) {
        return this.transbankService.getConfig(branchId);
    }
    saveConfig(branchId, body) {
        return this.transbankService.saveConfig(branchId, body);
    }
};
exports.TransbankController = TransbankController;
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [record_transaction_dto_1.RecordTransactionDto]),
    __metadata("design:returntype", void 0)
], TransbankController.prototype, "recordTransaction", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransbankController.prototype, "findByOrderId", null);
__decorate([
    (0, common_1.Get)('tenant/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransbankController.prototype, "findByTenant", null);
__decorate([
    (0, common_1.Post)('link-sale'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransbankController.prototype, "linkToSale", null);
__decorate([
    (0, common_1.Get)('config/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransbankController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransbankController.prototype, "saveConfig", null);
exports.TransbankController = TransbankController = __decorate([
    (0, common_1.Controller)('transbank'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [transbank_service_1.TransbankService])
], TransbankController);
//# sourceMappingURL=transbank.controller.js.map