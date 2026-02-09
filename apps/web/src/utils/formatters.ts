/**
 * Formats a number as Chilean Peso currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1.234" or "$12.345")
 */
export function formatPrice(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
        return '$0';
    }

    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Formats a number as Chilean Peso without currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1.234" or "12.345")
 */
export function formatNumber(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
        return '0';
    }

    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
