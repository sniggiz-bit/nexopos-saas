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
exports.DteConfigController = exports.DteConfigResponseDto = exports.UpdateDteConfigDto = exports.CreateDteConfigDto = void 0;
const common_1 = require("@nestjs/common");
const dte_config_service_1 = require("./dte-config.service");
class CreateDteConfigDto {
    tenantId;
    liorenToken;
    liorenLogo;
    dteResolution;
    resolutionDate;
}
exports.CreateDteConfigDto = CreateDteConfigDto;
class UpdateDteConfigDto {
    liorenToken;
    liorenLogo;
    dteResolution;
    resolutionDate;
}
exports.UpdateDteConfigDto = UpdateDteConfigDto;
class DteConfigResponseDto {
    id;
    tenantId;
    liorenToken;
    liorenLogo;
    dteResolution;
    resolutionDate;
}
exports.DteConfigResponseDto = DteConfigResponseDto;
let DteConfigController = class DteConfigController {
    dteConfigService;
    constructor(dteConfigService) {
        this.dteConfigService = dteConfigService;
    }
    async findByTenant(tenantId = 'tenant-1') {
        return this.dteConfigService.findByTenant(tenantId);
    }
    async upsert(createDteConfigDto) {
        return this.dteConfigService.upsert(createDteConfigDto);
    }
    async update(id, updateDteConfigDto) {
        return this.dteConfigService.update(id, updateDteConfigDto);
    }
};
exports.DteConfigController = DteConfigController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DteConfigController.prototype, "findByTenant", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateDteConfigDto]),
    __metadata("design:returntype", Promise)
], DteConfigController.prototype, "upsert", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateDteConfigDto]),
    __metadata("design:returntype", Promise)
], DteConfigController.prototype, "update", null);
exports.DteConfigController = DteConfigController = __decorate([
    (0, common_1.Controller)('dte-config'),
    __metadata("design:paramtypes", [dte_config_service_1.DteConfigService])
], DteConfigController);
//# sourceMappingURL=dte-config.controller.js.map