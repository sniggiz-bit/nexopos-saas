import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private jwtService;
    private prisma;
    constructor(jwtService: JwtService, prisma: PrismaService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
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
    generateSsoToken(user: {
        userId: string;
        tenantId: string;
    }): Promise<{
        access_token: string;
    }>;
    validateSsoToken(token: string): Promise<any>;
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
