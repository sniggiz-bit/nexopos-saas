import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signIn(signInDto: {
        userId: string;
        tenantId: string;
    }): Promise<{
        access_token: string;
    }>;
    validate(body: {
        token: string;
    }): Promise<{
        isValid: boolean;
        user: any;
    }>;
}
