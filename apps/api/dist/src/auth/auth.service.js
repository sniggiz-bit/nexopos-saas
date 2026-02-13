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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    jwtService;
    prisma;
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
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
                        const { password, ...result } = user;
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
                        const { password, ...result } = user;
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
            const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId, branchId: user.branchId };
            const token = await this.jwtService.signAsync(payload);
            console.log(`[AuthService] Token generated successfully`);
            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    branchId: user.branchId
                }
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
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.login(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map