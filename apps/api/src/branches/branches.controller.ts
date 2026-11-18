import {
  Controller,
  BadRequestException,
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

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  create(
    @Body()
    createBranchDto: { tenantId: string; name: string; address?: string; isMain?: boolean; isActive?: boolean },
    @Request() req,
  ) {
    console.log('[BranchesController] Create User:', req.user);
    const tenantId = createBranchDto.tenantId;
    if (!tenantId) {
      console.error('[BranchesController] Tenant ID missing in request user');
      throw new BadRequestException('Indica la empresa de la sucursal.');
    }
    return this.branchesService.create({ ...createBranchDto, tenantId }, req.user.sub);
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
    @Request() req: any,
  ) {
    return this.branchesService.updateStatus(id, statusDto.isActive, req.user.sub);
  }
}
