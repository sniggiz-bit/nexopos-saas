import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    findAll() {
        return this.tenantsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }

    @Patch(':id/limits')
    updateLimits(@Param('id') id: string, @Body() body: { maxUsers?: number; maxProducts?: number }) {
        return this.tenantsService.updateLimits(id, body);
    }

    @Patch(':id/suspend')
    suspend(@Param('id') id: string) {
        return this.tenantsService.suspend(id);
    }

    @Patch(':id/activate')
    activate(@Param('id') id: string) {
        return this.tenantsService.activate(id);
    }
}
