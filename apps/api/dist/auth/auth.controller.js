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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const register_tenant_dto_1 = require("./dto/register-tenant.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const super_admin_guard_1 = require("./super-admin.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(signInDto) {
        try {
            const user = await this.authService.validateUser(signInDto.email, signInDto.password);
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return await this.authService.login(user);
        }
        catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }
    signIn(signInDto) {
        return this.authService.generateSsoToken(signInDto);
    }
    async validate(body) {
        if (!body.token) {
            throw new common_1.UnauthorizedException('Token is required');
        }
        const payload = await this.authService.validateSsoToken(body.token);
        return { isValid: true, user: payload };
    }
    async registerTenant(dto) {
        return this.authService.registerTenant(dto);
    }
    async impersonate(userId) {
        return this.authService.impersonate(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Login de usuario', description: 'Autentica a un usuario y genera un token JWT.' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'admin@demo.cl' },
                password: { type: 'string', example: 'admin123' },
            },
            required: ['email', 'password'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login exitoso, devuelve el JWT y datos del usuario.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciales inválidas.' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Generar Token SSO', description: 'Genera un token para Single Sign-On entre aplicaciones del ecosistema.' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('sso/token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signIn", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Validar Token SSO' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('sso/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validate", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Registrar nuevo Inquilino (SaaS)', description: 'Permite el registro inicial de una empresa y su administrador.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Inquilino creado exitosamente.' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.Post)('register-tenant'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_tenant_dto_1.RegisterTenantDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerTenant", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Impersonar usuario', description: 'Permite a un Super Admin loguearse como cualquier otro usuario. Requiere rol SUPER_ADMIN.' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)('impersonate/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "impersonate", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('autenticación'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map