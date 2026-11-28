import * as XLSX from 'xlsx';

export interface ProductImportInput {
    rowNumber: number;
    name?: string;
    sku?: string;
    barcode?: string;
    category?: string;
    brand?: string;
    price?: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
    unitType?: 'UNIT' | 'WEIGHT';
    warnings: string[];
}

export interface ProductImportRowResult {
    rowNumber: number;
    name?: string;
    sku?: string;
    outcome: 'created' | 'updated' | 'skipped' | 'error';
    message?: string;
    warnings: string[];
}

export interface ProductImportBatchResult {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    results: ProductImportRowResult[];
}

const columnAliases = {
    name: ['nombre', 'producto', 'name'],
    sku: ['sku', 'codigointerno'],
    barcode: ['codigodebarras', 'codigodebarra', 'ean', 'upc'],
    category: ['categoria', 'familia'],
    brand: ['marca', 'brand'],
    price: ['precio', 'price'],
    costPrice: ['costo', 'costoprecio', 'cost'],
    stock: ['stockinicial', 'stockactual', 'stock', 'existencia', 'cantidad'],
    minStock: ['stockminimo', 'minimostock'],
    unitType: ['tipo', 'unidad', 'unittype'],
} as const;

function normalizeHeader(value: unknown): string {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function parseNumber(value: unknown, integer: boolean): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) && value >= 0
            ? integer ? Math.round(value) : Math.round(value * 1000) / 1000
            : undefined;
    }

    const text = String(value ?? '').trim();
    const token = text.match(/[+-]?\d[\d.,]*/)?.[0];
    if (!token) return undefined;

    let normalized = token;
    const lastDot = token.lastIndexOf('.');
    const lastComma = token.lastIndexOf(',');
    if (lastDot >= 0 && lastComma >= 0) {
        const decimalSeparator = lastDot > lastComma ? '.' : ',';
        const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
        normalized = token.split(thousandsSeparator).join('');
        if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
    } else if (lastDot >= 0) {
        const groups = token.split('.');
        normalized = groups.length > 1 && groups.slice(1).every(group => group.length === 3)
            ? groups.join('')
            : token;
    } else if (lastComma >= 0) {
        const groups = token.split(',');
        normalized = groups.length > 2 && groups.slice(1).every(group => group.length === 3)
            ? groups.join('')
            : token.replace(',', '.');
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return integer ? Math.round(parsed) : Math.round(parsed * 1000) / 1000;
}

export function parseProductImportSheet(sheet: XLSX.WorkSheet): ProductImportInput[] {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: true,
        defval: null,
        blankrows: true,
    });
    if (matrix.length < 2) return [];

    const headers = matrix[0].map(normalizeHeader);
    const columnIndex = (field: keyof typeof columnAliases) =>
        headers.findIndex(header => (columnAliases[field] as readonly string[]).includes(header));
    const columns = {
        name: columnIndex('name'),
        sku: columnIndex('sku'),
        barcode: columnIndex('barcode'),
        category: columnIndex('category'),
        brand: columnIndex('brand'),
        price: columnIndex('price'),
        costPrice: columnIndex('costPrice'),
        stock: columnIndex('stock'),
        minStock: columnIndex('minStock'),
        unitType: columnIndex('unitType'),
    };
    if (columns.name < 0) throw new Error('No se encontró una columna Nombre o Producto.');

    const headerWarnings = [
        ...(columns.price < 0 ? ['No se encontró la columna Precio; los productos nuevos quedarán con precio 0.'] : []),
        ...(columns.stock < 0 ? ['No se encontró la columna Stock; no se asignará stock inicial.'] : []),
    ];
    const seenSkus = new Set<string>();
    const importedRows: ProductImportInput[] = [];

    for (let index = 1; index < matrix.length; index++) {
        const cells = matrix[index];
        if (!cells.some(cell => cell !== null && cell !== undefined && String(cell).trim())) continue;

        const value = (column: number) => column < 0 ? undefined : cells[column];
        const text = (column: number) => {
            const cell = value(column);
            if (cell === null || cell === undefined) return undefined;
            const result = String(cell).trim();
            return result || undefined;
        };
        const warnings = [...headerWarnings];
        const sku = text(columns.sku);
        const skuKey = sku?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (skuKey && seenSkus.has(skuKey)) {
            warnings.push('El SKU se repite en el archivo.');
        }
        if (skuKey) seenSkus.add(skuKey);

        const numeric = (column: number, label: string, integer: boolean) => {
            const cell = value(column);
            if (cell === null || cell === undefined || String(cell).trim() === '') return undefined;
            const parsed = parseNumber(cell, integer);
            if (parsed === undefined) warnings.push(`${label} no se pudo interpretar; se conservará el valor existente o se usará 0.`);
            return parsed;
        };
        const rawType = normalizeHeader(value(columns.unitType));
        let unitType: ProductImportInput['unitType'];
        if (rawType.includes('granel') || rawType === 'weight') unitType = 'WEIGHT';
        else if (rawType.includes('unidad') || rawType === 'unit') unitType = 'UNIT';
        else if (rawType) warnings.push('El tipo de unidad no se reconoció; se conservará el existente o se usará Unidad.');

        importedRows.push({
            rowNumber: index + 1,
            name: text(columns.name),
            sku,
            barcode: text(columns.barcode),
            category: text(columns.category),
            brand: text(columns.brand),
            price: numeric(columns.price, 'Precio', true),
            costPrice: numeric(columns.costPrice, 'Costo', true),
            stock: numeric(columns.stock, 'Stock', false),
            minStock: numeric(columns.minStock, 'Stock mínimo', true),
            unitType,
            warnings,
        });
    }

    return importedRows;
}
