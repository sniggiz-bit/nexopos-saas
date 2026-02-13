import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(signInDto: Record<string, any>): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            tenantId: any;
            branchId: any;
        };
    }>;
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
    impersonate(userId: string): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            tenantId: any;
            branchId: any;
        };
    }>;
}
