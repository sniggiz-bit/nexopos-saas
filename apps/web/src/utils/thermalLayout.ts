export interface ThermalOptions { columns80?: 42 | 48; cutPaper?: boolean }
export type ThermalFormat = '80mm' | '58mm';
export const thermalColumns = (format: ThermalFormat, options: ThermalOptions = {}) => format === '58mm' ? 32 : options.columns80 === 42 ? 42 : 48;
/** Portable ASCII text: never interpret product names as ESC/POS commands. */
export function receiptText(value: unknown): string {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u00a0\t\r]/g, ' ').replace(/[\u2010-\u2015]/g, '-')
        .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
        .replace(/[¡¿]/g, '').replace(/[^\x20-\x7e\n]/g, '?');
}
export function wrapReceiptText(value: unknown, width: number): string[] {
    const result: string[] = [];
    for (const paragraph of receiptText(value).split('\n')) {
        let line = '';
        for (let word of paragraph.split(/\s+/).filter(Boolean)) {
            if (line && line.length + 1 + word.length > width) { result.push(line); line = ''; }
            while (word.length > width) { result.push(word.slice(0, width)); word = word.slice(width); }
            if (word) line += (line ? ' ' : '') + word;
        }
        result.push(line);
    }
    return result;
}
export function receiptAmountLine(label: string, amount: string, width: number): string[] {
    const left = receiptText(label); const right = receiptText(amount);
    if (left.length + right.length + 1 <= width) return [left + ' '.repeat(width - left.length - right.length) + right];
    return [...wrapReceiptText(left, width), ...wrapReceiptText(right, width).map(line => line.padStart(width))];
}
