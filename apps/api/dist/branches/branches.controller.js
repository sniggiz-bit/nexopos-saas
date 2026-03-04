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
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const branches_service_1 = require("./branches.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/super-admin.guard");
const resource_limit_guard_1 = require("../auth/resource-limit.guard");
const check_limit_decorator_1 = require("../auth/decorators/check-limit.decorator");
let BranchesController = class BranchesController {
    branchesService;
    constructor(branchesService) {
        this.branchesService = branchesService;
    }
    create(createBranchDto, req) {
        console.log('[BranchesController] Create User:', req.user);
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            console.error('[BranchesController] Tenant ID missing in request user');
            throw new Error('Tenant ID missing');
        }
        return this.branchesService.create({ ...createBranchDto, tenantId });
    }
    findAll(req) {
        console.log('[BranchesController] FindAll User:', req.user);
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            console.error('[BranchesController] Tenant ID missing in request user for FindAll');
            return [];
        }
        return this.branchesService.findAll(tenantId);
    }
    findAllSystemWide() {
        return this.branchesService.findAllSystemWide();
    }
    updateStatus(id, statusDto) {
        return this.branchesService.updateStatus(id, statusDto.isActive);
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(resource_limit_guard_1.ResourceLimitGuard),
    (0, check_limit_decorator_1.CheckLimit)('maxBranches'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('system'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "findAllSystemWide", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "updateStatus", null);
exports.BranchesController = BranchesController = __decorate([
    (0, common_1.Controller)('branches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [branches_service_1.BranchesService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map