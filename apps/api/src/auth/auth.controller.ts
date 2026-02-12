
import { Body, Controller, Post, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() signInDto: Record<string, any>) {
        const user = await this.authService.validateUser(signInDto.email, signInDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
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
}
