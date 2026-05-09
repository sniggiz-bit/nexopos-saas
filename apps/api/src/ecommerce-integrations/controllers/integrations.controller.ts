import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { IntegrationService } from '../services/integration.service';
import { ProductSyncService } from '../services/product-sync.service';
import { InventorySyncService } from '../services/inventory-sync.service';
import { OrderSyncService } from '../services/order-sync.service';
import { WebhookService } from '../services/webhook.service';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly productSyncService: ProductSyncService,
    private readonly inventorySyncService: InventorySyncService,
    private readonly orderSyncService: OrderSyncService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('connections')
  create(@Request() req: any, @Body() dto: CreateConnectionDto) {
    return this.integrationService.create(req.user.tenantId, dto);
  }

  @Get('connections')
  findAll(@Request() req: any) {
    return this.integrationService.findAll(req.user.tenantId);
  }

  @Get('connections/:id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.integrationService.findOne(id, req.user.tenantId);
  }

  @Patch('connections/:id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateConnectionDto,
  ) {
    return this.integrationService.update(id, req.user.tenantId, dto);
  }

  @Delete('connections/:id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.integrationService.remove(id, req.user.tenantId);
  }

  @Post('connections/:id/test')
  @HttpCode(HttpStatus.OK)
  testConnection(@Request() req: any, @Param('id') id: string) {
    return this.integrationService.testConnection(id, req.user.tenantId);
  }

  @Post('connections/:id/sync/products')
  @HttpCode(HttpStatus.OK)
  async syncProducts(@Request() req: any, @Param('id') id: string) {
    await this.integrationService.findOne(id, req.user.tenantId);
    this.productSyncService.syncProducts(id); // async, no await
    return { message: 'Sincronización de productos iniciada' };
  }

  @Post('connections/:id/sync/inventory')
  @HttpCode(HttpStatus.OK)
  async syncInventory(@Request() req: any, @Param('id') id: string) {
    await this.integrationService.findOne(id, req.user.tenantId);
    this.inventorySyncService.syncInventory(id);
    return { message: 'Sincronización de inventario iniciada' };
  }

  @Post('connections/:id/sync/orders')
  @HttpCode(HttpStatus.OK)
  async syncOrders(@Request() req: any, @Param('id') id: string) {
    await this.integrationService.findOne(id, req.user.tenantId);
    this.orderSyncService.pullOrders(id);
    return { message: 'Importación de pedidos iniciada' };
  }

  @Post('connections/:id/sync/full')
  @HttpCode(HttpStatus.OK)
  async syncFull(@Request() req: any, @Param('id') id: string) {
    await this.integrationService.findOne(id, req.user.tenantId);
    this.productSyncService.syncProducts(id);
    this.inventorySyncService.syncInventory(id);
    this.orderSyncService.pullOrders(id);
    return { message: 'Sincronización completa iniciada' };
  }

  @Post('connections/:id/webhooks/register')
  @HttpCode(HttpStatus.OK)
  async registerWebhooks(
    @Request() req: any,
    @Param('id') id: string,
    @Query('baseUrl') baseUrl: string,
  ) {
    await this.integrationService.findOne(id, req.user.tenantId);
    const url = baseUrl ?? process.env.API_PUBLIC_URL ?? 'https://nexopos.cl/api';
    await this.webhookService.registerWebhooksForConnection(id, url);
    return { message: 'Webhooks registrados' };
  }

  @Get('connections/:id/mappings')
  getMappings(@Request() req: any, @Param('id') id: string) {
    return this.integrationService.getMappings(id, req.user.tenantId);
  }

  @Delete('connections/:id/mappings/:mappingId')
  deleteMapping(
    @Request() req: any,
    @Param('id') id: string,
    @Param('mappingId') mappingId: string,
  ) {
    return this.integrationService.deleteMapping(id, mappingId, req.user.tenantId);
  }

  @Get('orders')
  getOrders(
    @Request() req: any,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.integrationService.getOrders(req.user.tenantId, connectionId);
  }

  @Post('orders/:id/process')
  @HttpCode(HttpStatus.OK)
  processOrder(@Param('id') id: string) {
    return this.orderSyncService.processOrder(id);
  }

  @Get('logs')
  getLogs(
    @Request() req: any,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.integrationService.getLogs(req.user.tenantId, connectionId);
  }
}
