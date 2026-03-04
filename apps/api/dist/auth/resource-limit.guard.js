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
exports.ResourceLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const check_limit_decorator_1 = require("./decorators/check-limit.decorator");
const RESOURCE_MAP = {
    maxBranches: { model: 'branch', field: 'tenantId' },
    maxRegisters: { model: 'register', field: 'tenantId' },
    maxUsers: { model: 'user', field: 'tenantId' },
};
let ResourceLimitGuard = class ResourceLimitGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const limitKey = this.reflector.getAllAndOverride(check_limit_decorator_1.LIMIT_KEY, [context.getHandler(), context.getClass()]);
        if (!limitKey)
            return true;
        const request = context.switchToHttp().getRequest();
        const tenantId = request.user?.tenantId;
        if (!tenantId) {
            throw new common_1.ForbiddenException('No tenant context found in request.');
        }
        const settings = await this.prisma.tenantSettings.findUnique({
            where: { tenantId },
        });
        if (!settings) {
            throw new common_1.NotFoundException(`TenantSettings not found for tenant ${tenantId}.`);
        }
        const limit = settings[limitKey];
        const resource = RESOURCE_MAP[limitKey];
        if (!resource) {
            return true;
        }
        const prismaDelegate = this.prisma[resource.model];
        const currentCount = await prismaDelegate.count({
            where: { [resource.field]: tenantId },
        });
        if (currentCount >= limit) {
            throw new common_1.ForbiddenException(`Has alcanzado el límite de tu plan (${currentCount}/${limit} ${limitKey.replace('max', '')}). ` +
                `Actualiza tu plan para agregar más.`);
        }
        return true;
    }
};
exports.ResourceLimitGuard = ResourceLimitGuard;
exports.ResourceLimitGuard = ResourceLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], ResourceLimitGuard);
//# sourceMappingURL=resource-limit.guard.js.map