import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
export declare class AuthService {
    private jwtService;
    private prisma;
    private emailService;
    constructor(jwtService: JwtService, prisma: PrismaService, emailService: EmailService);
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
    registerTenant(dto: RegisterTenantDto): Promise<{
        tenant: {
            id: any;
            name: any;
            slug: any;
        };
        branch: {
            id: any;
            name: any;
        };
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
    private generateSlug;
    private ensureUniqueSlug;
}
