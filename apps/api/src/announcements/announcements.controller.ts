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
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  create(@Body() createAnnouncementDto: any) {
    return this.announcementsService.create(createAnnouncementDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  findAll() {
    return this.announcementsService.findAll();
  }

  @Public()
  @Get('active')
  findActive() {
    return this.announcementsService.findActive();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  update(@Param('id') id: string, @Body() updateAnnouncementDto: any) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
