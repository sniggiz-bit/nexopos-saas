import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    private getTenantId(req: any): string {
        // JWT payload: { sub: userId, tenantId, branchId, role, email }
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            throw new BadRequestException('tenantId not found in token');
        }
        return tenantId;
    }

    @Get()
    findAll(@Request() req) {
        return this.suppliersService.findAll(this.getTenantId(req));
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.suppliersService.findOne(id, this.getTenantId(req));
    }

    @Post()
    create(
        @Body()
        body: {
            name: string;
            rut?: string;
            email?: string;
            phone?: string;
            address?: string;
        },
        @Request() req,
    ) {
        return this.suppliersService.create(body, this.getTenantId(req));
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body()
        body: {
            name?: string;
            rut?: string;
            email?: string;
            phone?: string;
            address?: string;
        },
        @Request() req,
    ) {
        return this.suppliersService.update(id, body, this.getTenantId(req));
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.suppliersService.remove(id, this.getTenantId(req));
    }
}
