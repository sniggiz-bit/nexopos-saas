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
exports.FeatureGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const require_feature_decorator_1 = require("./decorators/require-feature.decorator");
let FeatureGuard = class FeatureGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredFlag = this.reflector.getAllAndOverride(require_feature_decorator_1.FEATURE_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredFlag)
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
        if (!settings[requiredFlag]) {
            throw new common_1.ForbiddenException(`El módulo '${requiredFlag}' no está habilitado en tu plan. Contacta al administrador.`);
        }
        return true;
    }
};
exports.FeatureGuard = FeatureGuard;
exports.FeatureGuard = FeatureGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], FeatureGuard);
//# sourceMappingURL=feature.guard.js.map