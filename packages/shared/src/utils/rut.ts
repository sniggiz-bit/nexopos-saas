/**
 * Chilean RUT validation and formatting utility.
 */

/**
 * Validates a Chilean RUT (can be formatted or plain).
 */
export function validateRut(rut: string): boolean {
    if (!rut || typeof rut !== 'string') return false;

    // Clean the RUT: remove dots and hyphen
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();

    if (cleanRut.length < 8 || cleanRut.length > 9) return false;

    const dv = cleanRut.slice(-1);
    const cuerpo = cleanRut.slice(0, -1);

    return calculateDV(cuerpo) === dv;
}

/**
 * Formats a Chilean RUT to XX.XXX.XXX-X.
 */
export function formatRut(rut: string): string {
    if (!rut) return '';
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
    if (cleanRut.length < 2) return cleanRut;

    const dv = cleanRut.slice(-1);
    const cuerpo = cleanRut.slice(0, -1);

    // Add dots every 3 digits from right to left
    let formattedCuerpo = '';
    for (let i = cuerpo.length - 1, count = 0; i >= 0; i--) {
        formattedCuerpo = cuerpo.charAt(i) + formattedCuerpo;
        count++;
        if (count % 3 === 0 && i !== 0) {
            formattedCuerpo = '.' + formattedCuerpo;
        }
    }

    return `${formattedCuerpo}-${dv}`;
}

/**
 * Calculates the Digit Verifier (DV) for a RUT body.
 */
function calculateDV(cuerpo: string): string {
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        if (multiplo === 7) multiplo = 2;
        else multiplo++;
    }

    const res = 11 - (suma % 11);
    if (res === 11) return '0';
    if (res === 10) return 'K';
    return res.toString();
}
