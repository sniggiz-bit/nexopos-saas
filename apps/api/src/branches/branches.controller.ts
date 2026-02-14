import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Post()
    create(@Body() createBranchDto: { name: string; address?: string; isMain?: boolean }, @Request() req) {
        console.log('[BranchesController] Create User:', req.user);
        // Assuming the user's tenantId is available in req.user
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            console.error('[BranchesController] Tenant ID missing in request user');
            throw new Error('Tenant ID missing');
        }
        return this.branchesService.create({ ...createBranchDto, tenantId });
    }

    @Get()
    findAll(@Request() req) {
        console.log('[BranchesController] FindAll User:', req.user);
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            console.error('[BranchesController] Tenant ID missing in request user for FindAll');
            // Return empty or throw?
            return [];
        }
        return this.branchesService.findAll(tenantId);
    }
}
