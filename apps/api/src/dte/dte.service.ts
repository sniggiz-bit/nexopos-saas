import { Injectable } from '@nestjs/common';
import { LiorenService } from './lioren.service';

@Injectable()
export class DteService {
    constructor(private liorenService: LiorenService) { }

    /**
     * Emite un DTE real usando el servicio de Lioren
     * 
     * @param saleId - ID de la venta
     * @returns Resultado de la emisión
     */
    async emitirDte(saleId: string) {
        return this.liorenService.emitirBoleta(saleId);
    }
}
