/** Neutral presentation for older support content and audit records. Stored data is preserved. */
export function neutralBillingText(value: string): string {
    return value
        .replace(/https?:\/\/(?:[\w-]+\.)?lioren\.(?:cl|enterprises)[^\s<>]*/gi, 'servicio de facturación')
        .replace(/\b(con|en|de|por|a|desde)\s+lioren\b/gi, (_match, preposition: string) => preposition.toLowerCase() === 'de' ? 'del servicio de facturación' : preposition.toLowerCase() === 'a' ? 'al servicio de facturación' : preposition + ' el servicio de facturación')
        .replace(/\blioren\b/gi, 'servicio de facturación')
        .replace(/lioren/gi, 'billing');
}
