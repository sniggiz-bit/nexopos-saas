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
exports.ShiftsController = void 0;
const common_1 = require("@nestjs/common");
const shifts_service_1 = require("./shifts.service");
let ShiftsController = class ShiftsController {
    shiftsService;
    constructor(shiftsService) {
        this.shiftsService = shiftsService;
    }
    async openShift(body) {
        const { branchId, initialAmount, userId, tenantId } = body;
        if (!branchId || initialAmount === undefined || !userId || !tenantId) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        return this.shiftsService.openShift(tenantId, branchId, userId, initialAmount);
    }
    async closeShift(body) {
        const { shiftId, userId, finalAmount } = body;
        if (!shiftId || !userId || finalAmount === undefined) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        return this.shiftsService.closeShift(shiftId, userId, finalAmount);
    }
    async getCurrentShift(branchId) {
        return this.shiftsService.getCurrentShift(branchId);
    }
};
exports.ShiftsController = ShiftsController;
__decorate([
    (0, common_1.Post)('open'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "openShift", null);
__decorate([
    (0, common_1.Post)('close'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "closeShift", null);
__decorate([
    (0, common_1.Get)('current/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "getCurrentShift", null);
exports.ShiftsController = ShiftsController = __decorate([
    (0, common_1.Controller)('shifts'),
    __metadata("design:paramtypes", [shifts_service_1.ShiftsService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map