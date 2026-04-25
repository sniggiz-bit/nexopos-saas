import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { DteModule } from '../dte/dte.module';

@Module({
    imports: [DteModule],
    controllers: [CommonController],
})
export class CommonModule { }
