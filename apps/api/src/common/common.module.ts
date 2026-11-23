import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { RegistrationRutService } from './registration-rut.service';
import { DteModule } from '../dte/dte.module';

@Module({
    imports: [DteModule],
    controllers: [CommonController],
    providers: [RegistrationRutService],
})
export class CommonModule { }
