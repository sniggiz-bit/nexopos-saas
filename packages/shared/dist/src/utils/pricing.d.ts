import { PriceTier } from '../types';
/**
 * Logica compartida para calcular el precio unitario aplicando tramos mayoristas.
 *
 * @param basePrice - El precio base unitario del producto
 * @param priceTiers - Los tramos de precios configurados para el producto
 * @param quantity - La cantidad a comprar
 * @returns El precio unitario final a aplicar
 */
export declare function resolveUnitPrice(basePrice: number, priceTiers: PriceTier[] | undefined, quantity: number): number;
