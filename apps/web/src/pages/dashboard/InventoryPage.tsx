import { useState, useRef } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { CatalogPagination, CATALOG_PAGE_SIZE } from '../../components/dashboard/CatalogPagination';
import { CATALOG_HEADER_CLASS, CATALOG_ROW_CLASS, CatalogProductIdentity, CatalogRowAction, CatalogUnitBadge } from '../../components/dashboard/CatalogTableParts';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useBrands } from '../../hooks/useBrands';
import { InventoryKardexModal } from '../../components/dashboard/InventoryKardexModal';
import { StockAdjustModal } from '../../components/dashboard/StockAdjustModal';
import { Search, History, Loader2, Package, AlertCircle, Download, Upload, X, PackagePlus, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import type { Product } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
    parseProductImportSheet,
    type ProductImportBatchResult,
    type ProductImportInput,
    type ProductImportRowResult,
} from '../../utils/productExcelImport';

const INVENTORY_COLUMNS = [
    { label: 'Producto' },
    { label: 'Cód. barras', width: 144 },
    { label: 'Familia / Marca', width: '16%' },
    { label: 'Stock actual', width: 132 },
    { label: 'Tipo', width: 80 },
    { label: 'Estado', width: 120 },
    { label: 'Acciones', width: 108 },
];

const STOCK_STATES = {
    empty: {
        label: 'Agotado',
        number: 'text-red-700 dark:text-red-400',
        badge: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400',
    },
    low: {
        label: 'Stock Bajo',
        number: 'text-amber-800 dark:text-amber-300',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
    },
    sufficient: {
        label: 'Suficiente',
        number: 'text-foreground',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400',
    },
};

function InventoryStock({ product, numberClass }: { product: Product; numberClass: string }) {
    const unit = product.unitType === 'WEIGHT' ? 'kg' : 'uds';
    const quantity = (
        <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
            <span className={`font-bold tabular-nums ${numberClass}`}>{product.stock}</span>
            <span className="text-[11px] text-muted-foreground dark:text-slate-400">{unit}</span>
        </span>
    );

    if (!product.inventoryLevels?.length) return quantity;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Ver stock por sucursal"
                    aria-label={`Ver stock por sucursal de ${product.name}. Stock actual ${product.stock} ${unit}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {quantity}
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground dark:text-slate-400" aria-hidden="true" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" aria-label="Desglose por sucursal" className="max-h-72 w-60 overflow-y-auto p-3 text-xs">
                <p className="mb-2 border-b border-border pb-2 font-semibold">Desglose por sucursal</p>
                <ul className="space-y-2">
                    {product.inventoryLevels.map(level => (
                        <li key={level.branchId} className="flex justify-between gap-3">
                            <span className="min-w-0 break-words">{level.branchName}</span>
                            <span className="shrink-0 font-semibold tabular-nums">{level.quantity} {unit}</span>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}

export function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [requestedPage, setPage] = useState(1);
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [productForKardex, setProductForKardex] = useState<Product | null>(null);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [productForAdjust, setProductForAdjust] = useState<Product | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: products, isLoading, isError, refetch } = useProducts(user?.tenantId);
    const { data: categories } = useCategories(user?.tenantId || '');
    const { data: brands } = useBrands(user?.tenantId || '');

    const filteredProducts = (products || []).filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || product.category?.id === categoryFilter;
        const matchesBrand = !brandFilter || product.brand?.id === brandFilter;
        return matchesSearch && matchesCategory && matchesBrand;
    });
    const page = Math.min(requestedPage, Math.max(1, Math.ceil(filteredProducts.length / CATALOG_PAGE_SIZE)));
    const visibleProducts = filteredProducts.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);
    const catalogUnavailable = isError && !products;

    const handleKardex = (product: Product) => {
        setProductForKardex(product);
        setIsKardexOpen(true);
    };

    const handleAdjust = (product: Product) => {
        setProductForAdjust(product);
        setIsAdjustOpen(true);
    };

    const handleExportExcel = () => {
        const rows = filteredProducts.map(p => ({
            'Nombre': p.name,
            'SKU': p.sku || '',
            'Código de Barras': p.barcode || '',
            'Categoría': p.category?.name || '',
            'Marca': p.brand?.name || '',
            'Precio': p.price,
            'Costo': p.costPrice,
            'Stock Actual': p.stock,
            'Stock Mínimo': p.minStock,
            'Tipo': p.unitType === 'WEIGHT' ? 'Granel' : 'Unidad',
            'Estado': p.stock <= 0 ? 'Agotado' : p.stock <= p.minStock ? 'Stock Bajo' : 'Suficiente',
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

        // Column widths
        ws['!cols'] = [
            { wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
            { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
        ];

        XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Inventario exportado correctamente');
    };

    const handleDownloadTemplate = () => {
        const template = [{
            'Nombre': 'Ejemplo Producto',
            'SKU': 'SKU-001',
            'Código de Barras': '7891234567890',
            'Categoría': 'Bebidas',
            'Marca': 'MarcaEjemplo',
            'Precio': 1000,
            'Costo': 700,
            'Stock Inicial': 50,
            'Stock Mínimo': 5,
            'Tipo': 'Unidad',
        }];
        const ws = XLSX.utils.json_to_sheet(template);
        ws['!cols'] = Array(10).fill({ wch: 18 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, 'plantilla_carga_inventario.xlsx');
        toast.success('Plantilla descargada');
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.tenantId || isImporting) return;

        setIsImporting(true);
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = parseProductImportSheet(ws);

            if (rows.length === 0) {
                toast.error('El archivo está vacío');
                return;
            }

            const results: ProductImportRowResult[] = [];
            for (let offset = 0; offset < rows.length; offset += 100) {
                const batch = rows.slice(offset, offset + 100);
                try {
                    const response = await apiClient.post<ProductImportBatchResult>('/products/import', { rows: batch, onlyNew: true });
                    results.push(...response.data.results);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'No se pudo enviar este grupo de filas.';
                    results.push(...batch.map((row: ProductImportInput) => ({
                        rowNumber: row.rowNumber,
                        name: row.name,
                        sku: row.sku,
                        outcome: 'error' as const,
                        message,
                        warnings: row.warnings,
                    })));
                }
                setImportProgress(`${Math.min(offset + batch.length, rows.length)}/${rows.length}`);
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['products'] }),
                queryClient.invalidateQueries({ queryKey: ['products-all'] }),
                queryClient.invalidateQueries({ queryKey: ['categories'] }),
                queryClient.invalidateQueries({ queryKey: ['brands'] }),
            ]);

            const created = results.filter(result => result.outcome === 'created').length;
            const updated = results.filter(result => result.outcome === 'updated').length;
            const skipped = results.filter(result => result.outcome === 'skipped').length;
            const errors = results.filter(result => result.outcome === 'error').length;
            const rowsWithNotes = results.filter(result =>
                result.outcome === 'error' || result.outcome === 'skipped' || result.warnings.length > 0,
            );
            const summary = `${created} nuevos${updated ? `, ${updated} actualizados` : ''}, ${skipped} omitidos, ${errors} errores`;

            if (rowsWithNotes.length > 0) {
                const reportRows = results.map(result => ({
                    'Fila Excel': result.rowNumber,
                    'Resultado': result.outcome,
                    'Nombre': result.name || '',
                    'SKU': result.sku || '',
                    'Detalle': [result.message, ...result.warnings].filter(Boolean).join(' | '),
                }));
                const reportSheet = XLSX.utils.json_to_sheet(reportRows);
                const reportBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(reportBook, reportSheet, 'Resultado');
                XLSX.writeFile(reportBook, 'resultado_importacion_productos.xlsx');
                toast(`${summary}. Se descargó el detalle por fila.`, { icon: '⚠️', duration: 10000 });
            } else {
                toast.success(`${summary} correctamente`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al procesar el archivo Excel');
        } finally {
            setIsImporting(false);
            setImportProgress('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const hasFilters = searchTerm || categoryFilter || brandFilter;

    return (
        <DashboardLayout>
            <div className="min-w-0 space-y-4 animate-fade-up">
                <h1 className="sr-only">Inventario General</h1>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="relative w-full max-w-md flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <input
                            type="text"
                            aria-label="Buscar productos en inventario"
                            placeholder="Buscar por nombre, SKU o código..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-[13px] text-foreground outline-none transition-colors placeholder:!text-muted-foreground focus:border-cyan-600"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center px-3 py-2 border border-border rounded-lg text-sm text-foreground/[0.85] bg-card hover:bg-[#0099CC]/5 transition-colors shadow-sm"
                            title="Descargar plantilla Excel para carga masiva"
                        >
                            <Download className="w-4 h-4 mr-1.5 text-muted-foreground" />
                            Plantilla
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="inline-flex items-center px-3 py-2 border border-[#0099CC]/30 rounded-lg text-sm text-cyan-800 dark:text-cyan-300 bg-[#0099CC]/5 hover:bg-[#0099CC]/10 transition-colors shadow-sm disabled:opacity-50"
                            title="Agregar productos nuevos desde Excel"
                        >
                            {isImporting ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-1.5" />
                            )}
                            {isImporting ? (importProgress ? `Importando ${importProgress}` : 'Importando...') : 'Importar Excel'}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={isLoading || catalogUnavailable}
                            className="inline-flex items-center px-3 py-2 border border-emerald-500/30 rounded-lg text-sm text-emerald-800 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors shadow-sm disabled:opacity-50"
                            title="Exportar inventario a Excel"
                        >
                            <Download className="w-4 h-4 mr-1.5" />
                            Exportar Excel
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={handleImportExcel}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            aria-label="Filtrar por familia"
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                            className="max-w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground outline-none focus:border-cyan-600"
                        >
                            <option value="">Todas las familias</option>
                            {(categories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        <select
                            aria-label="Filtrar por marca"
                            value={brandFilter}
                            onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
                            className="max-w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground outline-none focus:border-cyan-600"
                        >
                            <option value="">Todas las marcas</option>
                            {(brands || []).map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                        </select>
                        {hasFilters && (
                            <button
                                onClick={() => { setSearchTerm(''); setCategoryFilter(''); setBrandFilter(''); setPage(1); }}
                                className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                            >
                                <X className="mr-1 h-4 w-4" aria-hidden="true" /> Limpiar
                            </button>
                        )}
                    </div>
                    {!isLoading && !catalogUnavailable && (
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} {hasFilters ? 'encontrados' : 'en total'}
                            </p>
                            <CatalogPagination page={page} total={filteredProducts.length} onPageChange={setPage} />
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div role="region" aria-label="Listado de inventario" tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                        <table className="w-full min-w-[900px] table-fixed text-[13px]">
                            <colgroup>
                                {INVENTORY_COLUMNS.map(({ label, width }) => <col key={label} style={{ width }} />)}
                            </colgroup>
                            <thead>
                                <tr className="border-b border-border">
                                    {INVENTORY_COLUMNS.map(({ label }) => (
                                        <th key={label} scope="col" className={`${CATALOG_HEADER_CLASS} ${label === 'Acciones' ? 'text-right' : 'text-left'}`}>
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={INVENTORY_COLUMNS.length} className="px-4 py-12 text-center">
                                            <Loader2 aria-hidden="true" className="mx-auto h-8 w-8 animate-spin text-cyan-700 dark:text-cyan-300" />
                                            <p role="status" className="mt-2 text-sm text-muted-foreground">Cargando inventario...</p>
                                        </td>
                                    </tr>
                                ) : catalogUnavailable ? (
                                    <tr>
                                        <td colSpan={INVENTORY_COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                                            <p role="alert">No se pudo cargar el catálogo completo.</p>
                                            <button type="button" className="mt-2 font-semibold text-foreground underline" onClick={() => void refetch()}>
                                                Reintentar
                                            </button>
                                        </td>
                                    </tr>
                                ) : visibleProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={INVENTORY_COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                                            <Package aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-cyan-700 dark:text-cyan-500" />
                                            {hasFilters ? 'No hay productos que coincidan con los filtros.' : 'No se encontraron productos en el inventario.'}
                                        </td>
                                    </tr>
                                ) : (
                                    visibleProducts.map(product => {
                                        const stockState = product.stock <= 0 ? 'empty' : product.stock <= product.minStock ? 'low' : 'sufficient';
                                        const stock = STOCK_STATES[stockState];
                                        const family = product.category?.name ?? 'Sin familia';
                                        const brand = product.brand?.name ?? 'Sin marca';

                                        return (
                                            <tr key={product.id} className={CATALOG_ROW_CLASS}>
                                                <td className="px-4 py-3.5">
                                                    <CatalogProductIdentity product={product} />
                                                </td>
                                                <td className="truncate px-4 py-3.5 font-mono text-xs text-muted-foreground dark:text-slate-400" title={product.barcode}>
                                                    {product.barcode || '—'}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <p className="truncate text-xs font-semibold text-foreground" title={family}>{family}</p>
                                                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground dark:text-slate-400" title={brand}>{brand}</p>
                                                </td>
                                                <td className="px-3 py-3.5">
                                                    <InventoryStock product={product} numberClass={stock.number} />
                                                </td>
                                                <td className="px-3 py-3.5">
                                                    <CatalogUnitBadge unitType={product.unitType} />
                                                </td>
                                                <td className="px-3 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${stock.badge}`}>
                                                        {stockState !== 'sufficient' && <AlertCircle aria-hidden="true" className="h-3 w-3 shrink-0" />}
                                                        {stock.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <CatalogRowAction onClick={() => handleAdjust(product)} tone="emerald" label="Ajustar stock">
                                                            <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                                                        </CatalogRowAction>
                                                        <CatalogRowAction onClick={() => handleKardex(product)} tone="violet" label="Ver Kardex">
                                                            <History className="h-3.5 w-3.5" aria-hidden="true" />
                                                        </CatalogRowAction>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <InventoryKardexModal
                    isOpen={isKardexOpen}
                    onClose={() => {
                        setIsKardexOpen(false);
                        setProductForKardex(null);
                    }}
                    product={productForKardex}
                />

                {isAdjustOpen && productForAdjust && (
                    <StockAdjustModal
                        product={productForAdjust}
                        onClose={() => {
                            setIsAdjustOpen(false);
                            setProductForAdjust(null);
                        }}
                        onSuccess={() => {}}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
