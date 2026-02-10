import { Module, Global } from '@nestjs/common';
import { DteService } from './dte.service';
import { LiorenService } from './lioren.service';

@Global()
@Module({
    providers: [DteService, LiorenService],
    exports: [DteService, LiorenService],
})
export class DteModule { }
