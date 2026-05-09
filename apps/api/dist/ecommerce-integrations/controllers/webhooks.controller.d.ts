import { Request } from 'express';
type RawRequest = Request & {
    rawBody?: Buffer;
};
import { WebhookService } from '../services/webhook.service';
export declare class WebhooksController {
    private readonly webhookService;
    private readonly logger;
    constructor(webhookService: WebhookService);
    shopifyWebhook(connectionId: string, topic: string, hmac: string, req: RawRequest): Promise<{
        received: boolean;
    }>;
    wooCommerceWebhook(connectionId: string, topic: string, signature: string, req: RawRequest): Promise<{
        received: boolean;
    }>;
}
export {};
