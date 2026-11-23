import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { formatRut, validateRut } from '@nexopos/shared';
import { LiorenService } from '../dte/lioren.service';

export interface RegistrationRutResult {
  success: boolean;
  data?: { rut: string; reasonSocial: string; giro: string; address: string; comuna: string; city: string };
  message?: string;
}

const unavailable = (): RegistrationRutResult => ({ success: false, message: 'No hay datos disponibles para este RUT. Puedes completar los datos manualmente.' });
const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

@Injectable()
export class RegistrationRutService {
  private readonly cache = new Map<string, { expires: number; result: RegistrationRutResult }>();
  private readonly pending = new Map<string, Promise<RegistrationRutResult>>();
  private readonly limits = new Map<string, { expires: number; count: number }>();

  private providerWindow = { expires: 0, count: 0 };

  constructor(private readonly lioren: LiorenService) {}

  async lookup(input: string, client: string): Promise<RegistrationRutResult> {
    if (typeof input !== 'string' || input.length > 20 || !/^[0-9.kK-]+$/.test(input.trim()) || !validateRut(input)) {
      throw new BadRequestException('El RUT no es válido. Revisa el dígito verificador.');
    }
    const now = Date.now();
    for (const [key, entry] of this.limits) if (entry.expires <= now) this.limits.delete(key);
    for (const [key, entry] of this.cache) if (entry.expires <= now) this.cache.delete(key);
    const limit = this.limits.get(client);
    if (limit && limit.count >= 20 || !limit && this.limits.size >= 2000) this.tooMany();
    this.limits.set(client, { expires: limit?.expires ?? now + 60000, count: (limit?.count ?? 0) + 1 });

    const rut = formatRut(input);
    const cached = this.cache.get(rut);
    if (cached) return cached.result;
    const active = this.pending.get(rut);
    if (active) return active;
    if (this.providerWindow.expires <= now) this.providerWindow = { expires: now + 60000, count: 0 };
    if (this.pending.size >= 20 || this.providerWindow.count >= 60) this.tooMany();
    this.providerWindow.count++;
    const request = this.fetch(rut);
    this.pending.set(rut, request);
    try {
      const result = await request;
      if (this.cache.size >= 200) {
        const oldest = this.cache.keys().next().value;
        if (oldest !== undefined) this.cache.delete(oldest);
      }
      this.cache.set(rut, { result, expires: Date.now() + (result.success ? 300000 : 15000) });
      return result;
    } finally { this.pending.delete(rut); }
  }

  private tooMany(): never {
    throw new HttpException('Se alcanzó el límite de consultas. Puedes completar los datos manualmente o intentar más tarde.', HttpStatus.TOO_MANY_REQUESTS);
  }

  private async fetch(rut: string): Promise<RegistrationRutResult> {
    try {
      const result = await this.lioren.consultaRut(rut, undefined, false);
      const data = 'data' in result ? result.data : undefined;
      if (!result.success || !data) return unavailable();
      const company = {
        rut, reasonSocial: text(data.reasonSocial, 150), giro: text(data.giro, 150),
        address: text(data.address, 300), comuna: text(data.comuna, 100), city: text(data.city, 100),
      };
      if (!company.reasonSocial && !company.giro && !company.address) return unavailable();
      return { success: true, data: company };
    } catch { return unavailable(); }
  }
}
