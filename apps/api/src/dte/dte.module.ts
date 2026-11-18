import { Module, Global } from '@nestjs/common';
import { DteService } from './dte.service';
import { LiorenService } from './lioren.service';
import { LiorenApiService } from './lioren-api.service';
import { LiorenAccountService } from './lioren-account.service';

@Global()
@Module({
  providers: [DteService, LiorenService, LiorenApiService, LiorenAccountService],
  exports: [DteService, LiorenService, LiorenApiService, LiorenAccountService],
})
export class DteModule {}
