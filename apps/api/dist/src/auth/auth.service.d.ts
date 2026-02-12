import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    generateSsoToken(user: {
        userId: string;
        tenantId: string;
    }): Promise<{
        access_token: string;
    }>;
    validateSsoToken(token: string): Promise<any>;
}
