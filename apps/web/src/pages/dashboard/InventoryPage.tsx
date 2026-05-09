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
            <div className="space-y-4">
                {/* Header bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <p className="text-gray-600 text-sm">
                        Consulta y gestiona los niveles de stock de todos tus productos en tiempo real.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                            title="Descargar plantilla Excel para carga masiva"
                        >
                            <Download className="w-4 h-4 mr-1.5 text-gray-500" />
                            Plantilla
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
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
                            className="inline-flex items-center px-3 py-2 border border-green-300 rounded-lg text-sm text-green-700 bg-green-50 hover:bg-green-100 transition-colors shadow-sm"
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, SKU o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]"
                    >
                        <option value="">Todas las familias</option>
                        {(categories || []).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"
                    >
                        <option value="">Todas las marcas</option>
                        {(brands || []).map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    {hasFilters && (
                        <button
                            onClick={() => { setSearchTerm(''); setCategoryFilter(''); setBrandFilter(''); }}
                            className="inline-flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-4 h-4 mr-1" /> Limpiar
                        </button>
                    )}
                </div>

                {/* Results count */}
                {!isLoading && (
                    <p className="text-xs text-gray-500">
                        {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} {hasFilters ? 'encontrados' : 'en total'}
                    </p>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Identificadores</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Familia / Marca</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                        <p className="mt-2 text-gray-500">Cargando inventario...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Warehouse className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        {hasFilters ? 'No hay productos que coincidan con los filtros.' : 'No se encontraron productos en el inventario.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Warehouse className="w-full h-full p-2 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {product.unitType === 'WEIGHT' ? 'Granel (kg)' : 'Unidad'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs font-mono text-gray-600">SKU: {product.sku || '-'}</div>
                                            <div className="text-xs font-mono text-gray-600">EAN: {product.barcode || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-700 font-medium">{product.category?.name || <span className="text-gray-400">Sin familia</span>}</div>
                                            <div className="text-xs text-gray-500">{product.brand?.name || <span className="text-gray-400">Sin marca</span>}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="relative group cursor-help">
                                                <span className={`text-lg font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-xs text-gray-400 ml-1">
                                                    {product.unitType === 'WEIGHT' ? 'kg' : 'uds'}
                                                </span>
                                                {product.inventoryLevels && product.inventoryLevels.length > 0 && (
                                                    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3">
                                                        <div className="font-bold mb-1 border-b border-gray-700 pb-1">Desglose por Sucursal</div>
                                                        <div className="space-y-1">
                                                            {product.inventoryLevels.map((lvl) => (
                                                                <div key={lvl.branchId} className="flex justify-between">
                                                                    <span>{lvl.branchName}:</span>
                                                                    <span className="font-mono">{lvl.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {product.stock <= 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Agotado
                                                </span>
                                            ) : product.stock <= product.minStock ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Stock Bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    Suficiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleAdjust(product)}
                                                    title="Ajustar stock"
                                                    className="p-2 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all"
                                                >
                                                    <PackagePlus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleKardex(product)}
                                                    title="Ver Kardex"
                                                    className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
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
