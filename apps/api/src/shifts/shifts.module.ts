
import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { ShiftReportService } from './shift-report.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ShiftsController],
    providers: [ShiftsService, ShiftReportService],
    exports: [ShiftsService, ShiftReportService],
})
export class ShiftsModule { }
