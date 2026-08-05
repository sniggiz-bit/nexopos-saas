import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import * as bcrypt from 'bcrypt';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { formatRut } from '@nexopos/shared';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
    @Inject(forwardRef(() => TenantsService))
    private tenantsService: TenantsService,
    private notificationsService: NotificationsService,
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
        const isHashed =
          user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
        console.log(`[AuthService] Password hashed: ${isHashed}`);

        if (isHashed) {
          const isMatch = await bcrypt.compare(pass, user.password);
          console.log(`[AuthService] Password match: ${isMatch}`);
          if (isMatch) {
            const { password: _password, ...result } = user;
            return result;
          }
        } else {
          // Plain text fallback for legacy/seed users
          console.log(
            `[AuthService] Checking plain text password for legacy user`,
          );
          if (user.password === pass) {
            // Update to hashed password
            console.log(`[AuthService] Updating to hashed password`);
            const hashedPassword = await bcrypt.hash(pass, 10);
            await this.prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword },
            });
            const { password: _password, ...result } = user;
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
      console.log(
        `[AuthService] Logging in user: ${user.id}, Role: ${user.role}, tenantId: ${user.tenantId}, branchId: ${user.branchId}`,
      );

      let activeModules: string[] = [];

      if (user.tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            plan: {
              include: {
                planModules: {
                  include: { module: true }
                }
              }
            },
            tenantModuleAddons: {
              include: { module: true }
            }
          }
        });

        if (tenant) {
          // Block login for suspended tenants
          if (tenant.status === 'SUSPENDED') {
            throw new UnauthorizedException(
              'Tu cuenta ha sido suspendida. Contacta al administrador.'
            );
          }

          const planModules = tenant.plan?.planModules.map(pm => pm.module.code) || [];
          const addonModules = tenant.tenantModuleAddons?.map(addon => addon.module.code) || [];
          activeModules = [...new Set([...planModules, ...addonModules])];
        }
      }

      // Always include tenantId and branchId so controllers can trust they exist
      const payload: any = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? null,
        branchId: user.branchId ?? null,
        modules: activeModules,
      };

      console.log('[AuthService] JWT payload being signed:', payload);

      const token = await this.jwtService.signAsync(payload);
      console.log(`[AuthService] Token generated successfully`);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId ?? null,
          branchId: user.branchId ?? null,
          modules: activeModules,
        },
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
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return the same payload structure as login
    // But we are bypassing password validation
    return this.login(user);
  }

  /**
   * Register a new tenant with atomic transaction
   * Creates: Tenant, Branch (Casa Matriz), User (ADMIN)
   */
  async registerTenant(dto: RegisterTenantDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Generate unique slug from company name
    const baseSlug = this.generateSlug(dto.companyName);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      // Use unified TenantsService to create Tenant, Branch, and User atomically
      const result = await this.tenantsService.createWithDefaults({
        tenant: {
          name: dto.companyName,
          slug,
          phone: dto.phone,
          rut: dto.rut ? formatRut(dto.rut) : undefined,
          giro: dto.giro,
          address: dto.address,
          status: 'ACTIVE',
        },
        admin: {
          email: dto.email,
          name: dto.userName,
          password: hashedPassword,
          role: 'TENANT_ADMIN',
        },
      });

      // 4. Send welcome email (non-blocking)
      this.emailService
        .sendWelcomeEmail(dto.email, dto.userName, {
          email: dto.email,
          password: dto.password,
          companyName: dto.companyName,
        })
        .catch((err) => {
          console.error('Failed to send welcome email:', err);
        });

      // Notify SuperAdmin
      this.notificationsService.notifySuperAdmin(
        'Nuevo Registro',
        `El comercio "${dto.companyName}" se ha registrado exitosamente. Usuario: ${dto.userName} (${dto.email})`,
        'REGISTRATION'
      ).catch(e => console.error('Failed to notify superadmin:', e));

      // 5. Generate JWT token for auto-login
      const token = await this.login(result.user);

      return {
        ...token,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
        branch: {
          id: result.branch.id,
          name: result.branch.name,
        },
      };
    } catch (error) {
      console.error('🔴 ERROR REAL DE PRISMA AL REGISTRAR TENANT:', error);
      console.error('🔴 Código:', (error as any)?.code);
      console.error('🔴 Mensaje:', (error as any)?.message);
      console.error('🔴 Meta:', (error as any)?.meta);
      console.error('🔴 Stack:', (error as any)?.stack);
      // Re-throw generic or specific error
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Error al crear la cuenta. Por favor intenta nuevamente.',
      );
    }
  }

  /**
   * Generate slug from company name
   * Example: "Botillería El Cielo" -> "botilleria-el-cielo"
   */
  private generateSlug(companyName: string): string {
    return companyName
      .toLowerCase()
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single
  }

  /**
   * Ensure slug is unique by appending suffix if needed
   * Example: "botilleria-el-cielo" -> "botilleria-el-cielo-1" if exists
   */
  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
  }
}
