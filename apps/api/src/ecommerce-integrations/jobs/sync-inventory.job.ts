import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InventorySyncService } from '../services/inventory-sync.service';

@Injectable()
export class SyncInventoryJob {
  private readonly logger = new Logger(SyncInventoryJob.name);

  constructor(private readonly inventorySyncService: InventorySyncService) {}

  // Cada 15 minutos
  @Cron('0 */15 * * * *')
  async run(): Promise<void> {
    this.logger.log('Running scheduled inventory sync');
    await this.inventorySyncService.syncAllActiveConnections();
  }
}
