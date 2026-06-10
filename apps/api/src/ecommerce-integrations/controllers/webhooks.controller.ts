import {
  Controller,
  Post,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

type RawRequest = Request & { rawBody?: Buffer };
import { WebhookService } from '../services/webhook.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post('shopify/:connectionId')
  @HttpCode(HttpStatus.OK)
  async shopifyWebhook(
    @Param('connectionId') connectionId: string,
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Req() req: RawRequest,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    const payload = req.body;

    this.logger.log(`Shopify webhook received: ${topic} for ${connectionId}`);

    // Proceso async para responder 200 rápido
    this.webhookService
      .handleShopifyWebhook(connectionId, topic, rawBody, hmac ?? '', payload)
      .catch((e) => this.logger.error(`Shopify webhook error: ${e.message}`));

    return { received: true };
  }

  @Public()
  @Post('woocommerce/:connectionId')
  @HttpCode(HttpStatus.OK)
  async wooCommerceWebhook(
    @Param('connectionId') connectionId: string,
    @Headers('x-wc-webhook-topic') topic: string,
    @Headers('x-wc-webhook-signature') signature: string,
    @Req() req: RawRequest,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    const payload = req.body;

    this.logger.log(`WooCommerce webhook received: ${topic} for ${connectionId}`);

    this.webhookService
      .handleWooCommerceWebhook(connectionId, topic, rawBody, signature ?? '', payload)
      .catch((e) => this.logger.error(`WooCommerce webhook error: ${e.message}`));

    return { received: true };
  }
}
