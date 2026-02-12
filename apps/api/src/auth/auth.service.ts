
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (user && user.password) {
            // Check if password is hashed (bcrypt hashes start with $2b$ or $2a$)
            const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');

            if (isHashed) {
                const isMatch = await bcrypt.compare(pass, user.password);
                if (isMatch) {
                    const { password, ...result } = user;
                    return result;
                }
            } else {
                // Plain text fallback for legacy/seed users
                if (user.password === pass) {
                    // Update to hashed password
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

    async login(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId, branchId: user.branchId };
        return {
            access_token: await this.jwtService.signAsync(payload),
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
