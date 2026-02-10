import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DteService {
    constructor(private prisma: PrismaService) { }

    /**
     * Mock DTE emission service - Simulates communication with SII (Servicio de Impuestos Internos)
     * In production, this would make real HTTP requests to SII's API
     * 
     * @param saleId - The ID of the sale to emit DTE for
     * @returns Promise with emission result
     */
    async emitirDte(saleId: string) {
        console.log(`[DTE Service] Iniciando emisión de DTE para venta ${saleId}...`);

        // Simulate network delay to SII (1 second)
        await this.delay(1000);

        // Generate random folio (in production, this comes from SII)
        const folio = this.generateRandomFolio();

        // Update sale with DTE information
        const updatedSale = await this.prisma.sale.update({
            where: { id: saleId },
            data: {
                dteFolio: folio,
                dteStatus: 'ACEPTADO',
            },
        });

        console.log(`[DTE Service] ✅ DTE emitido exitosamente. Folio: ${folio}, Status: ACEPTADO`);

        return {
            success: true,
            folio,
            status: 'ACEPTADO',
            saleId,
            message: 'DTE emitido correctamente (MOCK)',
        };
    }

    /**
     * Generate a random folio number between 5001 and 9999
     * In production, this would be provided by SII
     */
    private generateRandomFolio(): number {
        return Math.floor(Math.random() * (9999 - 5001 + 1)) + 5001;
    }

    /**
     * Utility function to simulate async delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
