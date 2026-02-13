import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('system-logs')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SystemLogsController {
    constructor(private readonly systemLogsService: SystemLogsService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.systemLogsService.findAll(query);
    }
}
