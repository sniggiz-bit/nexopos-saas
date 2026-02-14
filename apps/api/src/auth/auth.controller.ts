import { Body, Controller, Post, HttpCode, HttpStatus, UnauthorizedException, UseGuards, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() signInDto: Record<string, any>) {
        try {
            const user = await this.authService.validateUser(signInDto.email, signInDto.password);
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }
            return await this.authService.login(user);
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    @HttpCode(HttpStatus.OK)
    @Post('sso/token')
    signIn(@Body() signInDto: { userId: string; tenantId: string }) {
        return this.authService.generateSsoToken(signInDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('sso/validate')
    async validate(@Body() body: { token: string }) {
        if (!body.token) {
            throw new UnauthorizedException('Token is required');
        }
        const payload = await this.authService.validateSsoToken(body.token);
        return { isValid: true, user: payload };
    }

    /**
     * Public endpoint for tenant registration (Self-Service Onboarding)
     * No authentication required
     */
    @HttpCode(HttpStatus.CREATED)
    @Post('register-tenant')
    async registerTenant(@Body() dto: any) {
        return this.authService.registerTenant(dto);
    }

    // This endpoint should be guarded by SuperAdminGuard, but we'll leave it to the module definition
    // For now we assume the caller has checked permissions or the route is protected at Controller level if added there.
    // However, the requirement said "POST /auth/impersonate/:userId. Este endpoint debe validar que soy SUPER_ADMIN"
    // So we need to add the guard here or ensure the controller is not global-guarded if we want mixed access.
    // AuthController usually is public. We need to apply guard specifically here.
    // But we need to import SuperAdminGuard and UseGuards.
    // Let's add the method first, then add imports in a separate call or just rely on the implementation plan's structure if I can edit imports too.
    // I'll add the method first, then add imports.
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    @Post('impersonate/:userId')
    async impersonate(@Param('userId') userId: string) {
        return this.authService.impersonate(userId);
    }
}
