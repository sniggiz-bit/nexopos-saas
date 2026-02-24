import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { InternalReceiptService } from '../dte/internal-receipt.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReceiptsController],
  providers: [InternalReceiptService],
  exports: [InternalReceiptService],
})
export class ReceiptsModule {}
