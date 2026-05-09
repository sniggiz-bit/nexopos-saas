import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
import { ShopifyDriver } from '../drivers/shopify/shopify.driver';
import { WooCommerceDriver } from '../drivers/woocommerce/woocommerce.driver';
import { EcommerceDriverInterface } from '../interfaces/ecommerce-driver.interface';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateConnectionDto) {
    return this.prisma.ecommerceConnection.create({
      data: {
        tenantId,
        platform: dto.platform as any,
        name: dto.name,
        shopDomain: dto.shopDomain,
        accessToken: dto.accessToken,
        locationId: dto.locationId,
        siteUrl: dto.siteUrl,
        consumerKey: dto.consumerKey,
        consumerSecret: dto.consumerSecret,
        syncProducts: dto.syncProducts ?? true,
        syncInventory: dto.syncInventory ?? true,
        syncOrders: dto.syncOrders ?? true,
        syncCustomers: dto.syncCustomers ?? false,
        autoCreateSale: dto.autoCreateSale ?? false,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.ecommerceConnection.findMany({
      where: { tenantId },
      select: {
        id: true,
        platform: true,
        name: true,
        isActive: true,
        shopDomain: true,
        siteUrl: true,
        syncProducts: true,
        syncInventory: true,
        syncOrders: true,
        syncCustomers: true,
        autoCreateSale: true,
        locationId: true,
        lastSyncAt: true,
        syncStatus: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const conn = await this.prisma.ecommerceConnection.findFirst({
      where: { id, tenantId },
    });
    if (!conn) throw new NotFoundException('Conexión no encontrada');
    return conn;
  }

  async update(id: string, tenantId: string, dto: UpdateConnectionDto) {
    await this.findOne(id, tenantId);
    return this.prisma.ecommerceConnection.update({
      where: { id },
      data: {
        name: dto.name,
        shopDomain: dto.shopDomain,
        accessToken: dto.accessToken,
        locationId: dto.locationId,
        siteUrl: dto.siteUrl,
        consumerKey: dto.consumerKey,
        consumerSecret: dto.consumerSecret,
        syncProducts: dto.syncProducts,
        syncInventory: dto.syncInventory,
        syncOrders: dto.syncOrders,
        syncCustomers: dto.syncCustomers,
        autoCreateSale: dto.autoCreateSale,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    // Cascadea: borra mappings, webhooks, orders, logs
    await this.prisma.ecommerceConnection.delete({ where: { id } });
    return { message: 'Conexión eliminada' };
  }

  async testConnection(id: string, tenantId: string) {
    const conn = await this.findOne(id, tenantId);
    const driver = this.buildDriver(conn);
    const ok = await driver.testConnection();
    return { success: ok, message: ok ? 'Conexión exitosa' : 'No se pudo conectar' };
  }

  async getMappings(connectionId: string, tenantId: string) {
    await this.findOne(connectionId, tenantId);
    return this.prisma.productMapping.findMany({
      where: { connectionId },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });
  }

  async deleteMapping(connectionId: string, mappingId: string, tenantId: string) {
    await this.findOne(connectionId, tenantId);
    await this.prisma.productMapping.delete({ where: { id: mappingId } });
    return { message: 'Mapeo eliminado' };
  }

  async getLogs(tenantId: string, connectionId?: string) {
    return this.prisma.syncLog.findMany({
      where: {
        tenantId,
        ...(connectionId ? { connectionId } : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
  }

  async getOrders(tenantId: string, connectionId?: string) {
    return this.prisma.ecommerceOrder.findMany({
      where: {
        tenantId,
        ...(connectionId ? { connectionId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  buildDriver(conn: {
    platform: string;
    shopDomain?: string | null;
    accessToken?: string | null;
    locationId?: string | null;
    siteUrl?: string | null;
    consumerKey?: string | null;
    consumerSecret?: string | null;
    webhookSecret?: string | null;
  }): EcommerceDriverInterface {
    if (conn.platform === 'SHOPIFY') {
      if (!conn.shopDomain || !conn.accessToken) {
        throw new BadRequestException('Faltan credenciales de Shopify');
      }
      return new ShopifyDriver(conn.shopDomain, conn.accessToken, conn.locationId ?? undefined);
    }

    if (conn.platform === 'WOOCOMMERCE') {
      if (!conn.siteUrl || !conn.consumerKey || !conn.consumerSecret) {
        throw new BadRequestException('Faltan credenciales de WooCommerce');
      }
      return new WooCommerceDriver(
        conn.siteUrl,
        conn.consumerKey,
        conn.consumerSecret,
        conn.webhookSecret ?? undefined,
      );
    }

    throw new BadRequestException(`Plataforma no soportada: ${conn.platform}`);
  }
}
