import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MODULES_KEY = 'require_modules';
export const RequireModule = (...modules: string[]) => SetMetadata(REQUIRE_MODULES_KEY, modules);
