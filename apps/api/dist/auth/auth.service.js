"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const tenants_service_1 = require("../tenants/tenants.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    jwtService;
    prisma;
    emailService;
    tenantsService;
    constructor(jwtService, prisma, emailService, tenantsService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.emailService = emailService;
        this.tenantsService = tenantsService;
    }
    async validateUser(email, pass) {
        try {
            console.log(`[AuthService] Validating user: ${email}`);
            const user = await this.prisma.user.findUnique({
                where: { email },
            });
            console.log(`[AuthService] User found: ${!!user}`);
            if (user && user.password) {
                const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
                console.log(`[AuthService] Password hashed: ${isHashed}`);
                if (isHashed) {
                    const isMatch = await bcrypt.compare(pass, user.password);
                    console.log(`[AuthService] Password match: ${isMatch}`);
                    if (isMatch) {
                        const { password: _password, ...result } = user;
                        return result;
                    }
                }
                else {
                    console.log(`[AuthService] Checking plain text password for legacy user`);
                    if (user.password === pass) {
                        console.log(`[AuthService] Updating to hashed password`);
                        const hashedPassword = await bcrypt.hash(pass, 10);
                        await this.prisma.user.update({
                            where: { id: user.id },
                            data: { password: hashedPassword },
                        });
                        const { password: _password, ...result } = user;
                        return result;
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('[AuthService] Error validating user:', error);
            throw error;
        }
    }
    async login(user) {
        try {
            console.log(`[AuthService] Logging in user: ${user.id}, Role: ${user.role}`);
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            };
            if (user.tenantId) {
                payload.tenantId = user.tenantId;
            }
            if (user.branchId) {
                payload.branchId = user.branchId;
            }
            const token = await this.jwtService.signAsync(payload);
            console.log(`[AuthService] Token generated successfully`);
            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId || null,
                    branchId: user.branchId || null,
                },
            };
        }
        catch (error) {
            console.error('[AuthService] Error in login:', error);
            throw error;
        }
    }
    async generateSsoToken(user) {
        const payload = { sub: user.userId, tenantId: user.tenantId };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
    async validateSsoToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload;
        }
        catch {
            throw new common_1.UnauthorizedException();
        }
    }
    async impersonate(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.login(user);
    }
    async registerTenant(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        const baseSlug = this.generateSlug(dto.companyName);
        const slug = await this.ensureUniqueSlug(baseSlug);
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        try {
            const result = await this.tenantsService.createWithDefaults({
                tenant: {
                    name: dto.companyName,
                    slug,
                    phone: dto.phone,
                    rut: dto.rut,
                    giro: dto.giro,
                    address: dto.address,
                    status: 'ACTIVE',
                },
                admin: {
                    email: dto.email,
                    name: dto.userName,
                    password: hashedPassword,
                    role: 'TENANT_ADMIN',
                },
            });
            this.emailService
                .sendWelcomeEmail(dto.email, dto.userName, {
                email: dto.email,
                password: dto.password,
                companyName: dto.companyName,
            })
                .catch((err) => {
                console.error('Failed to send welcome email:', err);
            });
            const token = await this.login(result.user);
            return {
                ...token,
                tenant: {
                    id: result.tenant.id,
                    name: result.tenant.name,
                    slug: result.tenant.slug,
                },
                branch: {
                    id: result.branch.id,
                    name: result.branch.name,
                },
            };
        }
        catch (error) {
            console.error('[AuthService] Error registering tenant DETAILS:', error);
            if (error instanceof common_1.ConflictException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Error al crear la cuenta. Por favor intenta nuevamente.');
        }
    }
    generateSlug(companyName) {
        return companyName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    async ensureUniqueSlug(baseSlug) {
        let slug = baseSlug;
        let suffix = 1;
        while (true) {
            const existing = await this.prisma.tenant.findUnique({
                where: { slug },
            });
            if (!existing) {
                return slug;
            }
            slug = `${baseSlug}-${suffix}`;
            suffix++;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => tenants_service_1.TenantsService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        email_service_1.EmailService,
        tenants_service_1.TenantsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map