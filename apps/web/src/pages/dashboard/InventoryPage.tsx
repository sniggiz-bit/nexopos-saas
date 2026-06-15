import { useState, useRef } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useBrands } from '../../hooks/useBrands';
import { InventoryKardexModal } from '../../components/dashboard/InventoryKardexModal';
import { StockAdjustModal } from '../../components/dashboard/StockAdjustModal';
import { Search, History, Loader2, Warehouse, AlertCircle, Download, Upload, X, PackagePlus } from 'lucide-react';
import type { Product } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [isKardexOpen, setIsKardexOpen] = useState(false);
    const [productForKardex, setProductForKardex] = useState<Product | null>(null);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [productForAdjust, setProductForAdjust] = useState<Product | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useProducts(user?.tenantId);
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
        if (!file || !user?.tenantId) return;

        setIsImporting(true);
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows: any[] = XLSX.utils.sheet_to_json(ws);

            if (rows.length === 0) {
                toast.error('El archivo está vacío');
                return;
            }

            let created = 0;
            let errors = 0;

            for (const row of rows) {
                const nombre = row['Nombre']?.toString().trim();
                if (!nombre) continue;

                const categoryName = row['Categoría']?.toString().trim();
                const brandName = row['Marca']?.toString().trim();

                // Resolve category ID
                const cat = categoryName
                    ? (categories || []).find(c => c.name.toLowerCase() === categoryName.toLowerCase())
                    : null;

                // Resolve brand ID
                const brand = brandName
                    ? (brands || []).find(b => b.name.toLowerCase() === brandName.toLowerCase())
                    : null;

                try {
                    await apiClient.post('/products', {
                        name: nombre,
                        sku: row['SKU']?.toString().trim() || undefined,
                        barcode: row['Código de Barras']?.toString().trim() || undefined,
                        price: Number(row['Precio']) || 0,
                        costPrice: Number(row['Costo']) || 0,
                        initialStock: Number(row['Stock Inicial']) || 0,
                        minStock: Number(row['Stock Mínimo']) || 0,
                        unitType: row['Tipo']?.toString().trim() === 'Granel' ? 'WEIGHT' : 'UNIT',
                        categoryId: cat?.id || undefined,
                        brandId: brand?.id || undefined,
                        tenantId: user.tenantId,
                        isActive: true,
                    });
                    created++;
                } catch {
                    errors++;
                }
            }

            await queryClient.invalidateQueries({ queryKey: ['products'] });

            if (errors === 0) {
                toast.success(`${created} producto${created !== 1 ? 's' : ''} importado${created !== 1 ? 's' : ''} correctamente`);
            } else {
                toast(`${created} importados, ${errors} con error`, { icon: '⚠️' });
            }
        } catch {
            toast.error('Error al procesar el archivo Excel');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const hasFilters = searchTerm || categoryFilter || brandFilter;

    return (
        <DashboardLayout>
            <div className="space-y-4 animate-fade-up">
                {/* Header bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventario General</h1>
                        <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                            Consulta y gestiona los niveles de stock de todos tus productos en tiempo real
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center px-3 py-2 border border-border rounded-lg text-sm text-foreground/[0.85] bg-card hover:bg-[#0099CC]/5 transition-colors shadow-sm"
                            title="Descargar plantilla Excel para carga masiva"
                        >
                            <Download className="w-4 h-4 mr-1.5 text-muted-foreground/[0.5]" />
                            Plantilla
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="inline-flex items-center px-3 py-2 border border-[#0099CC]/30 rounded-lg text-sm text-[#0099CC] bg-[#0099CC]/5 hover:bg-[#0099CC]/10 transition-colors shadow-sm disabled:opacity-50"
                            title="Importar productos desde Excel"
                        >
                            {isImporting ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-1.5" />
                            )}
                            {isImporting ? 'Importando...' : 'Importar Excel'}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center px-3 py-2 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors shadow-sm"
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

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/[0.4]" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, SKU o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-card border border-border text-foreground rounded-lg focus:ring-2 focus:ring-[#0099CC] focus:border-transparent outline-none transition-all shadow-sm text-sm placeholder:text-muted-foreground/[0.3]"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm text-foreground/[0.85] bg-[hsl(var(--card))] shadow-sm focus:ring-2 focus:ring-[#0099CC] outline-none min-w-[160px]"
                    >
                        <option value="" className="bg-[hsl(var(--card))]">Todas las familias</option>
                        {(categories || []).map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-[hsl(var(--card))]">{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm text-foreground/[0.85] bg-[hsl(var(--card))] shadow-sm focus:ring-2 focus:ring-[#0099CC] outline-none min-w-[140px]"
                    >
                        <option value="" className="bg-[hsl(var(--card))]">Todas las marcas</option>
                        {(brands || []).map(brand => (
                            <option key={brand.id} value={brand.id} className="bg-[hsl(var(--card))]">{brand.name}</option>
                        ))}
                    </select>
                    {hasFilters && (
                        <button
                            onClick={() => { setSearchTerm(''); setCategoryFilter(''); setBrandFilter(''); }}
                            className="inline-flex items-center px-3 py-2 text-sm text-muted-foreground/[0.6] hover:text-foreground border border-border rounded-lg hover:bg-card transition-colors"
                        >
                            <X className="w-4 h-4 mr-1" /> Limpiar
                        </button>
                    )}
                </div>

                {/* Results count */}
                {!isLoading && (
                    <p className="text-xs text-muted-foreground/[0.4]">
                        {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} {hasFilters ? 'encontrados' : 'en total'}
                    </p>
                )}

                {/* Table */}
                <div className="rounded-xl overflow-hidden animate-fade-up bg-card border border-border">
                    <table className="min-w-full divide-y divide-border">
                        <thead style={{ background: 'hsl(var(--background))' }}>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Identificadores</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Familia / Marca</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock Actual</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#0099CC] mx-auto" />
                                        <p className="mt-2 text-sm text-muted-foreground/[0.5]">Cargando inventario...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground/[0.4]">
                                        <Warehouse className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        {hasFilters ? 'No hay productos que coincidan con los filtros.' : 'No se encontraron productos en el inventario.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-card border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Warehouse className="w-6 h-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-foreground/[0.95]">{product.name}</div>
                                                    <div className="text-xs text-muted-foreground/[0.4]">
                                                        {product.unitType === 'WEIGHT' ? 'Granel (kg)' : 'Unidad'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs font-mono text-foreground/[0.7]">SKU: {product.sku || '-'}</div>
                                            <div className="text-xs font-mono text-muted-foreground/[0.4]">EAN: {product.barcode || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-foreground/[0.85] font-semibold">{product.category?.name || <span className="text-muted-foreground/[0.3]">Sin familia</span>}</div>
                                            <div className="text-xs text-muted-foreground/[0.4]">{product.brand?.name || <span className="text-muted-foreground/[0.3]">Sin marca</span>}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="relative group cursor-help inline-block">
                                                <span className={`text-lg font-black tabular-nums ${product.stock <= product.minStock ? 'text-red-400' : 'text-white text-glow-cyan'}`}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-xs text-muted-foreground/[0.4] ml-1">
                                                    {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                                </span>
                                                {product.inventoryLevels && product.inventoryLevels.length > 0 && (
                                                    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black/95 text-foreground/[0.95] text-xs rounded-lg shadow-xl p-3 border border-border">
                                                        <div className="font-bold mb-1 border-b border-border pb-1">Desglose por Sucursal</div>
                                                        <div className="space-y-1">
                                                            {product.inventoryLevels.map((lvl) => (
                                                                <div key={lvl.branchId} className="flex justify-between">
                                                                    <span>{lvl.branchName}:</span>
                                                                    <span className="font-mono text-[#0099CC]">{lvl.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-black"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {product.stock <= 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Agotado
                                                </span>
                                            ) : product.stock <= product.minStock ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Stock Bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Suficiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleAdjust(product)}
                                                    title="Ajustar stock"
                                                    className="p-2 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/10 border border-transparent transition-all"
                                                >
                                                    <PackagePlus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleKardex(product)}
                                                    title="Ver Kardex"
                                                    className="p-2 rounded-lg text-[#0099CC] hover:text-white hover:bg-[#0099CC]/10 border border-transparent transition-all"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
