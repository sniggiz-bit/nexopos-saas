import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, RefreshCw, Trash2, Plug, CheckCircle, XCircle, Clock, ShoppingBag, Package, Layers, Zap } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { api } from '../../lib/api';

// ────────────────────────────────── Types ──────────────────────────────────

interface EcommerceConnection {
    id: string;
    platform: 'SHOPIFY' | 'WOOCOMMERCE';
    name: string;
    isActive: boolean;
    lastSyncAt: string | null;
    createdAt: string;
    credentials: Record<string, string>;
}

interface ExternalOrder {
    id: string;
    connectionId: string;
    externalId: string;
    status: string;
    totalAmount: number;
    currency: string;
    customerEmail: string | null;
    processedAt: string | null;
    createdAt: string;
    connection?: { name: string; platform: string };
}

type SyncType = 'products' | 'inventory' | 'orders' | 'full';

// ────────────────────────────────── API helpers ──────────────────────────────────

const fetchConnections = async (): Promise<EcommerceConnection[]> => {
    const { data } = await api.get('/integrations/connections');
    return data;
};

const fetchOrders = async (connectionId?: string): Promise<ExternalOrder[]> => {
    const { data } = await api.get('/integrations/orders', {
        params: connectionId ? { connectionId } : undefined,
    });
    return data;
};

// ────────────────────────────────── Sub-components ──────────────────────────────────

function PlatformBadge({ platform }: { platform: 'SHOPIFY' | 'WOOCOMMERCE' }) {
    if (platform === 'SHOPIFY') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                <ShoppingBag className="w-3 h-3" /> Shopify
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
            <ShoppingBag className="w-3 h-3" /> WooCommerce
        </span>
    );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return isActive ? (
        <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <CheckCircle className="w-3.5 h-3.5" /> Activa
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <XCircle className="w-3.5 h-3.5" /> Inactiva
        </span>
    );
}

// ────────────────────────────────── Create Connection Modal ──────────────────────────────────

interface CreateModalProps {
    onClose: () => void;
    onCreated: () => void;
}

function CreateConnectionModal({ onClose, onCreated }: CreateModalProps) {
    const [platform, setPlatform] = useState<'SHOPIFY' | 'WOOCOMMERCE'>('SHOPIFY');
    const [name, setName] = useState('');
    const [shopDomain, setShopDomain] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [locationId, setLocationId] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [consumerKey, setConsumerKey] = useState('');
    const [consumerSecret, setConsumerSecret] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: Record<string, string> = { platform, name };
            if (platform === 'SHOPIFY') {
                Object.assign(payload, { shopDomain, accessToken, locationId: locationId || undefined });
            } else {
                Object.assign(payload, { siteUrl, consumerKey, consumerSecret });
            }
            await api.post('/integrations/connections', payload);
            toast.success('Conexión creada exitosamente');
            onCreated();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Error al crear conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-semibold">Nueva Integración</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                        <div className="flex gap-3">
                            {(['SHOPIFY', 'WOOCOMMERCE'] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPlatform(p)}
                                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                        platform === p
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {p === 'SHOPIFY' ? 'Shopify' : 'WooCommerce'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la conexión</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Mi tienda Shopify"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {platform === 'SHOPIFY' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dominio de tienda</label>
                                <input
                                    type="text"
                                    required
                                    value={shopDomain}
                                    onChange={e => setShopDomain(e.target.value)}
                                    placeholder="mi-tienda.myshopify.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                                <input
                                    type="password"
                                    required
                                    value={accessToken}
                                    onChange={e => setAccessToken(e.target.value)}
                                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location ID <span className="text-gray-400">(opcional)</span></label>
                                <input
                                    type="text"
                                    value={locationId}
                                    onChange={e => setLocationId(e.target.value)}
                                    placeholder="ID de ubicación de inventario"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL del sitio</label>
                                <input
                                    type="url"
                                    required
                                    value={siteUrl}
                                    onChange={e => setSiteUrl(e.target.value)}
                                    placeholder="https://mi-tienda.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Key</label>
                                <input
                                    type="text"
                                    required
                                    value={consumerKey}
                                    onChange={e => setConsumerKey(e.target.value)}
                                    placeholder="ck_xxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Secret</label>
                                <input
                                    type="password"
                                    required
                                    value={consumerSecret}
                                    onChange={e => setConsumerSecret(e.target.value)}
                                    placeholder="cs_xxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Crear conexión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ────────────────────────────────── Connection Card ──────────────────────────────────

interface ConnectionCardProps {
    connection: EcommerceConnection;
    onRefresh: () => void;
}

function ConnectionCard({ connection, onRefresh }: ConnectionCardProps) {
    const queryClient = useQueryClient();
    const [syncLoading, setSyncLoading] = useState<SyncType | null>(null);
    const [testLoading, setTestLoading] = useState(false);

    const handleTest = async () => {
        setTestLoading(true);
        try {
            const { data } = await api.post(`/integrations/connections/${connection.id}/test`);
            toast.success(data.success ? 'Conexión exitosa ✓' : 'La conexión falló');
        } catch {
            toast.error('Error al probar la conexión');
        } finally {
            setTestLoading(false);
        }
    };

    const handleSync = async (type: SyncType) => {
        setSyncLoading(type);
        try {
            const { data } = await api.post(`/integrations/connections/${connection.id}/sync/${type}`);
            toast.success(data.message ?? 'Sincronización iniciada');
            queryClient.invalidateQueries({ queryKey: ['ecommerce-orders'] });
        } catch {
            toast.error('Error al iniciar sincronización');
        } finally {
            setSyncLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar la conexión "${connection.name}"? Esta acción no se puede deshacer.`)) return;
        try {
            await api.delete(`/integrations/connections/${connection.id}`);
            toast.success('Conexión eliminada');
            onRefresh();
        } catch {
            toast.error('Error al eliminar la conexión');
        }
    };

    const handleRegisterWebhooks = async () => {
        try {
            await api.post(`/integrations/connections/${connection.id}/webhooks/register`);
            toast.success('Webhooks registrados correctamente');
        } catch {
            toast.error('Error al registrar webhooks');
        }
    };

    const syncButtons: { type: SyncType; label: string; icon: React.ElementType }[] = [
        { type: 'products', label: 'Productos', icon: Package },
        { type: 'inventory', label: 'Inventario', icon: Layers },
        { type: 'orders', label: 'Pedidos', icon: ShoppingBag },
        { type: 'full', label: 'Todo', icon: Zap },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PlatformBadge platform={connection.platform} />
                        <StatusBadge isActive={connection.isActive} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{connection.name}</h3>
                    {connection.lastSyncAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Última sync: {new Date(connection.lastSyncAt).toLocaleString('es-CL')}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleDelete}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Eliminar conexión"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleTest}
                    disabled={testLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    <Plug className="w-3.5 h-3.5" />
                    {testLoading ? 'Probando...' : 'Probar'}
                </button>

                {syncButtons.map(({ type, label, icon: Icon }) => (
                    <button
                        key={type}
                        onClick={() => handleSync(type)}
                        disabled={syncLoading !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                        {syncLoading === type ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Icon className="w-3.5 h-3.5" />
                        )}
                        Sync {label}
                    </button>
                ))}

                <button
                    onClick={handleRegisterWebhooks}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100"
                >
                    <Zap className="w-3.5 h-3.5" />
                    Webhooks
                </button>
            </div>
        </div>
    );
}

// ────────────────────────────────── Orders Table ──────────────────────────────────

function OrdersTable({ connectionId }: { connectionId?: string }) {
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['ecommerce-orders', connectionId],
        queryFn: () => fetchOrders(connectionId),
    });

    const handleProcess = async (orderId: string) => {
        try {
            await api.post(`/integrations/orders/${orderId}/process`);
            toast.success('Pedido procesado como venta');
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Error al procesar pedido');
        }
    };

    if (isLoading) {
        return <div className="text-center py-8 text-gray-400">Cargando pedidos...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No hay pedidos externos importados</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {['ID Externo', 'Plataforma', 'Cliente', 'Total', 'Estado', 'Fecha', 'Acciones'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-700">#{order.externalId}</td>
                            <td className="px-4 py-3">
                                {order.connection && <PlatformBadge platform={order.connection.platform as any} />}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.customerEmail ?? '—'}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {order.currency} {(order.totalAmount / 100).toLocaleString('es-CL')}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    order.status === 'PROCESSED'
                                        ? 'bg-green-100 text-green-700'
                                        : order.status === 'FAILED'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('es-CL')}
                            </td>
                            <td className="px-4 py-3">
                                {order.processedAt === null && order.status !== 'PROCESSED' && (
                                    <button
                                        onClick={() => handleProcess(order.id)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Procesar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ────────────────────────────────── Main Page ──────────────────────────────────

export function IntegrationsPage() {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'connections' | 'orders'>('connections');
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | undefined>(undefined);

    const { data: connections = [], isLoading, refetch } = useQuery({
        queryKey: ['ecommerce-connections'],
        queryFn: fetchConnections,
    });

    const handleCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['ecommerce-connections'] });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Integraciones E-commerce</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Sincroniza productos, inventario y pedidos con Shopify o WooCommerce
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva conexión
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {[
                        { key: 'connections', label: 'Conexiones' },
                        { key: 'orders', label: 'Pedidos externos' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Connections tab */}
                {activeTab === 'connections' && (
                    <>
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-400">Cargando conexiones...</div>
                        ) : connections.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                <Plug className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <h3 className="text-gray-700 font-medium mb-1">Sin conexiones activas</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Crea tu primera conexión con Shopify o WooCommerce
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4 inline mr-1" />
                                    Nueva conexión
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {connections.map(conn => (
                                    <ConnectionCard
                                        key={conn.id}
                                        connection={conn}
                                        onRefresh={() => refetch()}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Orders tab */}
                {activeTab === 'orders' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {connections.length > 0 && (
                            <div className="p-4 border-b flex items-center gap-3">
                                <label className="text-sm text-gray-600 font-medium">Filtrar por conexión:</label>
                                <select
                                    value={selectedConnectionId ?? ''}
                                    onChange={e => setSelectedConnectionId(e.target.value || undefined)}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todas las conexiones</option>
                                    {connections.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <OrdersTable connectionId={selectedConnectionId} />
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateConnectionModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreated}
                />
            )}
        </DashboardLayout>
    );
}
