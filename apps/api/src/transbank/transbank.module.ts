import { Module } from '@nestjs/common';
import { TransbankController } from './transbank.controller';
import { TransbankService } from './transbank.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransbankController],
  providers: [TransbankService],
  exports: [TransbankService],
})
export class TransbankModule {}
