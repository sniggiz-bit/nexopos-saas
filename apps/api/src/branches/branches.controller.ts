import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { ResourceLimitGuard } from '../auth/resource-limit.guard';
import { CheckLimit } from '../auth/decorators/check-limit.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(ResourceLimitGuard)
  @CheckLimit('maxBranches')
  create(
    @Body()
    createBranchDto: { name: string; address?: string; isMain?: boolean },
    @Request() req,
  ) {
    console.log('[BranchesController] Create User:', req.user);
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
      console.error(
        '[BranchesController] Tenant ID missing in request user for FindAll',
      );
      return [];
    }
    return this.branchesService.findAll(tenantId);
  }

  @Get('system')
  @UseGuards(SuperAdminGuard)
  findAllSystemWide() {
    return this.branchesService.findAllSystemWide();
  }

  @Patch(':id/status')
  @UseGuards(SuperAdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: { isActive: boolean },
  ) {
    return this.branchesService.updateStatus(id, statusDto.isActive);
  }
}
