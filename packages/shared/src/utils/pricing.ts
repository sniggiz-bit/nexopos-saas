import { PriceTier } from '../types';

/**
 * Logica compartida para calcular el precio unitario aplicando tramos mayoristas.
 * 
 * @param basePrice - El precio base unitario del producto
 * @param priceTiers - Los tramos de precios configurados para el producto
 * @param quantity - La cantidad a comprar
 * @returns El precio unitario final a aplicar
 */
export function resolveUnitPrice(
    basePrice: number,
    priceTiers: PriceTier[] | undefined,
    quantity: number
): number {
    if (!priceTiers || priceTiers.length === 0) {
        return basePrice;
    }

    // Filtrar tramos aplicables (donde minQuantity <= cantidad)
    const applicableTiers = priceTiers.filter(tier => tier.minQuantity <= quantity);

    if (applicableTiers.length === 0) {
        return basePrice;
    }

    // Ordenar los tramos aplicables por minQuantity DESC (de mayor a menor)
    // para agarrar el tramo más grande que aplique.
    applicableTiers.sort((a, b) => b.minQuantity - a.minQuantity);

    // El primer tramo es el de mayor requerimiento mínimo que la cantidad cumple
    return applicableTiers[0].unitPrice;
}
