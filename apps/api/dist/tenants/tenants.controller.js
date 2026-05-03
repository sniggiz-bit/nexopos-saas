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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tenants_service_1 = require("./tenants.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/super-admin.guard");
const update_tenant_settings_dto_1 = require("./dto/update-tenant-settings.dto");
let TenantsController = class TenantsController {
    tenantsService;
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async findAll(search) {
        return this.tenantsService.findAll(search);
    }
    findOne(id, req) {
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        if (!isSuperAdmin && req.user?.tenantId !== id) {
            throw new common_1.ForbiddenException('Solo puedes acceder a los datos de tu propio tenant.');
        }
        return this.tenantsService.findOne(id);
    }
    updateSettings(id, dto) {
        return this.tenantsService.updateSettings(id, dto);
    }
    suspend(id) {
        return this.tenantsService.suspend(id);
    }
    activate(id) {
        return this.tenantsService.activate(id);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los inquilinos', description: 'Retorna una lista de todas las empresas/tenants registrados en el sistema. Requiere rol SUPER_ADMIN.' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Término de búsqueda por nombre o RUT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de inquilinos obtenida exitosamente.' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obtener un inquilino por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalles del inquilino.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inquilino no encontrado.' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar configuración del inquilino', description: 'Permite activar/desactivar módulos y cambiar límites de recursos.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuración actualizada.' }),
    (0, common_1.Patch)(':id/settings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_settings_dto_1.UpdateTenantSettingsDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateSettings", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Suspender inquilino', description: 'Marca al inquilino como SUSPENDED, bloqueando el acceso a sus usuarios.' }),
    (0, common_1.Patch)(':id/suspend'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "suspend", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Activar inquilino', description: 'Restaura el estado ACTIVE de un inquilino suspendido.' }),
    (0, common_1.Patch)(':id/activate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "activate", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('inquilinos (tenants)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map