
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
        try {
            console.log(`[AuthService] Validating user: ${email}`);
            const user = await this.prisma.user.findUnique({
                where: { email },
            });
            console.log(`[AuthService] User found: ${!!user}`);

            if (user && user.password) {
                // Check if password is hashed (bcrypt hashes start with $2b$ or $2a$)
                const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
                console.log(`[AuthService] Password hashed: ${isHashed}`);

                if (isHashed) {
                    const isMatch = await bcrypt.compare(pass, user.password);
                    console.log(`[AuthService] Password match: ${isMatch}`);
                    if (isMatch) {
                        const { password, ...result } = user;
                        return result;
                    }
                } else {
                    // Plain text fallback for legacy/seed users
                    console.log(`[AuthService] Checking plain text password for legacy user`);
                    if (user.password === pass) {
                        // Update to hashed password
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
        } catch (error) {
            console.error('[AuthService] Error validating user:', error);
            throw error;
        }
    }

    async login(user: any) {
        try {
            console.log(`[AuthService] Logging in user: ${user.id}, Role: ${user.role}`);

            // Build payload conditionally to avoid null values
            const payload: any = {
                sub: user.id,
                email: user.email,
                role: user.role
            };

            // Only add tenantId if it exists
            if (user.tenantId) {
                payload.tenantId = user.tenantId;
            }

            // Only add branchId if it exists
            if (user.branchId) {
                payload.branchId = user.branchId;
            }

            const token = await this.jwtService.signAsync(payload);
            console.log(`[AuthService] Token generated successfully`);

            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId || null,
                    branchId: user.branchId || null
                }
            };
        } catch (error) {
            console.error('[AuthService] Error in login:', error);
            throw error;
        }
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

    async impersonate(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Return the same payload structure as login
        // But we are bypassing password validation
        return this.login(user);
    }
}
