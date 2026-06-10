import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Marca una ruta como pública, eximiéndola del JwtAuthGuard global.
 * Usar en rutas que no requieren autenticación (login, register, etc.)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
