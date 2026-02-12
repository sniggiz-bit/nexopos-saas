
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async generateSsoToken(user: { userId: string; tenantId: string }) {
        const payload = { sub: user.userId, tenantId: user.tenantId };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async validateSsoToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload;
        } catch {
            throw new UnauthorizedException();
        }
    }
}
