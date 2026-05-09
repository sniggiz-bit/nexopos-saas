import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderSyncService } from '../services/order-sync.service';

@Injectable()
export class PullOrdersJob {
  private readonly logger = new Logger(PullOrdersJob.name);

  constructor(private readonly orderSyncService: OrderSyncService) {}

  // Cada 5 minutos como fallback si falla el webhook
  @Cron('0 */5 * * * *')
  async run(): Promise<void> {
    this.logger.log('Running scheduled order pull');
    await this.orderSyncService.pullAllActiveConnections();
  }
}
