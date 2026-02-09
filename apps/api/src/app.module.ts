import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesModule } from './sales/sales.module';
import { PrismaModule } from './prisma/prisma.module';
import { DteModule } from './dte/dte.module';

@Module({
  imports: [SalesModule, PrismaModule, DteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
