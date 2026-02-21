import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class JwtAuthGuard implements CanActivate {
    private jwtService;
    constructor();
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
