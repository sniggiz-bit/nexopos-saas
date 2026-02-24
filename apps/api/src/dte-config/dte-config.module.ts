import { Module } from '@nestjs/common';
import { DteConfigController } from './dte-config.controller';
import { DteConfigService } from './dte-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DteConfigController],
  providers: [DteConfigService],
  exports: [DteConfigService],
})
export class DteConfigModule {}
