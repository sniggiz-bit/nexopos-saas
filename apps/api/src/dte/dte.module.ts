import { Module, Global } from '@nestjs/common';
import { DteService } from './dte.service';

@Global()
@Module({
    providers: [DteService],
    exports: [DteService],
})
export class DteModule { }
