import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('public')
  findPublic() {
    return this.plansService.findPublic();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post()
  create(@Body() createPlanDto: any) {
    return this.plansService.create(createPlanDto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlanDto: any) {
    return this.plansService.update(id, updatePlanDto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
