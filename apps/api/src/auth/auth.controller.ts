import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

@ApiTags('autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @ApiOperation({ summary: 'Login de usuario', description: 'Autentica a un usuario y genera un token JWT.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@demo.cl' },
        password: { type: 'string', example: 'admin123' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve el JWT y datos del usuario.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    try {
      const user = await this.authService.validateUser(
        signInDto.email,
        signInDto.password,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return await this.authService.login(user);
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Generar Token SSO', description: 'Genera un token para Single Sign-On entre aplicaciones del ecosistema.' })
  @HttpCode(HttpStatus.OK)
  @Post('sso/token')
  signIn(@Body() signInDto: { userId: string; tenantId: string }) {
    return this.authService.generateSsoToken(signInDto);
  }

  @ApiOperation({ summary: 'Validar Token SSO' })
  @HttpCode(HttpStatus.OK)
  @Post('sso/validate')
  async validate(@Body() body: { token: string }) {
    if (!body.token) {
      throw new UnauthorizedException('Token is required');
    }
    const payload = await this.authService.validateSsoToken(body.token);
    return { isValid: true, user: payload };
  }

  @ApiOperation({ summary: 'Registrar nuevo Inquilino (SaaS)', description: 'Permite el registro inicial de una empresa y su administrador.' })
  @ApiResponse({ status: 201, description: 'Inquilino creado exitosamente.' })
  @HttpCode(HttpStatus.CREATED)
  @Post('register-tenant')
  async registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @ApiOperation({ summary: 'Impersonar usuario', description: 'Permite a un Super Admin loguearse como cualquier otro usuario. Requiere rol SUPER_ADMIN.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('impersonate/:userId')
  async impersonate(@Param('userId') userId: string) {
    return this.authService.impersonate(userId);
  }
}
