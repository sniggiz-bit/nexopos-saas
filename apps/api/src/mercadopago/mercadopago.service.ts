import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadopagoService {
  private readonly logger = new Logger(MercadopagoService.name);
  private client: MercadoPagoConfig | null = null;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (accessToken) {
      this.client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
      this.logger.log('MercadoPago SDK inicializado con token provisto en ENV.');
    } else {
      this.logger.warn('MP_ACCESS_TOKEN no encontrado en las variables de entorno. Mercado Pago no podrá procesar pagos reales.');
    }
  }

  async createSubscriptionPreference(tenantId: string, moduleName: string, price: number) {
    // Si no hay token configurado, retornamos un link falso (sandbox simulado) para que el frontend pueda fluir.
    if (!this.client) {
      this.logger.warn('Generando link de pago simulado porque no hay MP_ACCESS_TOKEN.');
      return {
        id: `mock-pref-${Date.now()}`,
        init_point: `https://www.mercadopago.cl/sandbox/simulado?tenant=${tenantId}&module=${encodeURIComponent(moduleName)}`
      };
    }

    try {
      const preference = new Preference(this.client);
      
      const response = await preference.create({
        body: {
          items: [
            {
              id: `MOD-${Date.now()}`,
              title: `Suscripción Módulo: ${moduleName}`,
              quantity: 1,
              unit_price: price || 10000,
              currency_id: 'CLP',
            }
          ],
          external_reference: tenantId,
          // back_urls configurados para el frontend en entorno dev
          back_urls: {
            success: 'http://localhost:5173/dashboard/subscription?status=success',
            failure: 'http://localhost:5173/dashboard/subscription?status=failure',
            pending: 'http://localhost:5173/dashboard/subscription?status=pending'
          },
          auto_return: 'approved'
        }
      });

      return {
        id: response.id,
        init_point: response.init_point
      };
    } catch (error) {
      this.logger.error('Error creando preferencia en Mercado Pago:', error);
      throw new InternalServerErrorException('Error conectando con la pasarela de pago');
    }
  }
}
