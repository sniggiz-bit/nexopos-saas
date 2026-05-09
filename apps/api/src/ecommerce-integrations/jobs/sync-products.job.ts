import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductSyncService } from '../services/product-sync.service';

@Injectable()
export class SyncProductsJob {
  private readonly logger = new Logger(SyncProductsJob.name);

  constructor(private readonly productSyncService: ProductSyncService) {}

  // Cada 6 horas
  @Cron(CronExpression.EVERY_6_HOURS)
  async run(): Promise<void> {
    this.logger.log('Running scheduled product sync');
    await this.productSyncService.syncAllActiveConnections();
  }
}
