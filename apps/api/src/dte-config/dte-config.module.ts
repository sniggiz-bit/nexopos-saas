import { Module } from '@nestjs/common';
import { DteConfigController } from './dte-config.controller';
import { DteConfigService } from './dte-config.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';

@Module({
  imports: [PrismaModule, DteModule],
  controllers: [DteConfigController],
  providers: [DteConfigService],
  exports: [DteConfigService],
})
export class DteConfigModule {}
