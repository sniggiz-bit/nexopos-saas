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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                <ShoppingBag className="w-3 h-3" /> Shopify
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm shadow-purple-500/5">
            <ShoppingBag className="w-3 h-3" /> WooCommerce
        </span>
    );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return isActive ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Activa
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/5 border border-red-500/20 px-2.5 py-0.5 rounded-full">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border bg-[hsl(var(--card))]">
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-bold text-foreground">Nueva Integración</h2>
                    <button onClick={onClose} className="text-muted-foreground/[0.6] hover:text-foreground transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-foreground/[0.85] mb-1.5">Plataforma</label>
                        <div className="flex gap-3">
                            {(['SHOPIFY', 'WOOCOMMERCE'] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPlatform(p)}
                                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                                        platform === p
                                            ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]'
                                            : 'border-border text-muted-foreground/[0.6] hover:border-border bg-card'
                                    }`}
                                >
                                    {p === 'SHOPIFY' ? 'Shopify' : 'WooCommerce'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">Nombre de la conexión</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Mi tienda Shopify"
                            className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                        />
                    </div>

                    {platform === 'SHOPIFY' ? (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">Dominio de tienda</label>
                                <input
                                    type="text"
                                    required
                                    value={shopDomain}
                                    onChange={e => setShopDomain(e.target.value)}
                                    placeholder="mi-tienda.myshopify.com"
                                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">Access Token</label>
                                <input
                                    type="password"
                                    required
                                    value={accessToken}
                                    onChange={e => setAccessToken(e.target.value)}
                                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">Location ID <span className="text-muted-foreground/[0.4] font-normal">(opcional)</span></label>
                                <input
                                    type="text"
                                    value={locationId}
                                    onChange={e => setLocationId(e.target.value)}
                                    placeholder="ID de ubicación de inventario"
                                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">URL del sitio</label>
                                <input
                                    type="url"
                                    required
                                    value={siteUrl}
                                    onChange={e => setSiteUrl(e.target.value)}
                                    placeholder="https://mi-tienda.com"
                                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">Consumer Key</label>
                                <input
                                    type="text"
                                    required
                                    value={consumerKey}
                                    onChange={e => setConsumerKey(e.target.value)}
                                    placeholder="ck_xxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground/[0.85] mb-1">Consumer Secret</label>
                                <input
                                    type="password"
                                    required
                                    value={consumerSecret}
                                    onChange={e => setConsumerSecret(e.target.value)}
                                    placeholder="cs_xxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-lg text-sm focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/[0.3]"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border text-foreground/[0.85] hover:bg-[#00D4FF]/5 rounded-lg text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold rounded-lg text-sm transition-all disabled:opacity-50"
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
        <div className="rounded-xl border border-border p-5 space-y-4 hover:border-border transition-all duration-300 shadow-[0_0_20px_rgba(0,212,255,0.02)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <PlatformBadge platform={connection.platform} />
                        <StatusBadge isActive={connection.isActive} />
                    </div>
                    <h3 className="font-bold text-foreground text-[15px]">{connection.name}</h3>
                    {connection.lastSyncAt && (
                        <p className="text-xs text-muted-foreground/[0.4] mt-1.5 flex items-center">
                            <Clock className="w-3.5 h-3.5 inline mr-1 text-[#00D4FF]" />
                            Última sync: {new Date(connection.lastSyncAt).toLocaleString('es-CL')}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleDelete}
                    className="text-muted-foreground/[0.4] hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                    title="Eliminar conexión"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                <button
                    onClick={handleTest}
                    disabled={testLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-[#00D4FF]/5 text-foreground/[0.85] font-medium transition-colors disabled:opacity-50"
                >
                    <Plug className="w-3.5 h-3.5" />
                    {testLoading ? 'Probando...' : 'Probar'}
                </button>

                {syncButtons.map(({ type, label, icon: Icon }) => (
                    <button
                        key={type}
                        onClick={() => handleSync(type)}
                        disabled={syncLoading !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#00D4FF]/5 text-[#00D4FF] border border-[#00D4FF]/20 rounded-lg hover:bg-[#00D4FF]/10 transition-colors disabled:opacity-50 font-semibold"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/5 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition-colors font-semibold"
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
            <table className="min-w-full divide-y divide-border">
                <thead style={{ background: 'hsl(var(--background))' }}>
                    <tr>
                        {['ID Externo', 'Plataforma', 'Cliente', 'Total', 'Estado', 'Fecha', 'Acciones'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {orders.map(order => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-foreground/[0.9]">#{order.externalId}</td>
                            <td className="px-4 py-3">
                                {order.connection && <PlatformBadge platform={order.connection.platform as any} />}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground/[0.7]">{order.customerEmail ?? '—'}</td>
                            <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">
                                {order.currency} {(order.totalAmount / 100).toLocaleString('es-CL')}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    order.status === 'PROCESSED'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : order.status === 'FAILED'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                    {order.status === 'PROCESSED' ? 'Procesado' : order.status === 'FAILED' ? 'Fallido' : 'Pendiente'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground/[0.4] tabular-nums">
                                {new Date(order.createdAt).toLocaleDateString('es-CL')}
                            </td>
                            <td className="px-4 py-3">
                                {order.processedAt === null && order.status !== 'PROCESSED' && (
                                    <button
                                        onClick={() => handleProcess(order.id)}
                                        className="text-xs text-[#00D4FF] hover:text-white font-bold hover:bg-[#00D4FF]/10 px-2.5 py-1 rounded-md transition-colors border border-[#00D4FF]/25"
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
            <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Integraciones E-commerce</h1>
                        <p className="text-[13px] text-muted-foreground/[0.5] mt-1">
                            Sincroniza productos, inventario y pedidos con Shopify o WooCommerce
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Nueva conexión
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-lg w-fit border border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {[
                        { key: 'connections', label: 'Conexiones' },
                        { key: 'orders', label: 'Pedidos externos' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                                activeTab === tab.key
                                    ? 'bg-[#00D4FF] text-[#0B0F1A] shadow-[0_0_10px_rgba(0,212,255,0.25)]'
                                    : 'text-muted-foreground/[0.6] hover:text-white'
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
                            <div className="text-center py-12 text-muted-foreground/[0.5]">
                                <div className="w-6 h-6 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <span>Cargando conexiones...</span>
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card max-w-2xl mx-auto">
                                <Plug className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                                <h3 className="text-foreground font-bold mb-1">Sin conexiones activas</h3>
                                <p className="text-sm text-muted-foreground/[0.5] mb-4">
                                    Crea tu primera conexión con Shopify o WooCommerce
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00BCE0] text-[#0B0F1A] font-bold rounded-lg text-sm transition-all"
                                >
                                    <Plus className="w-4 h-4 inline mr-1 stroke-[3]" />
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
                    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {connections.length > 0 && (
                            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                                <label className="text-sm text-foreground/[0.85] font-semibold">Filtrar por conexión:</label>
                                <select
                                    value={selectedConnectionId ?? ''}
                                    onChange={e => setSelectedConnectionId(e.target.value || undefined)}
                                    className="text-sm border border-border bg-[hsl(var(--card))] text-foreground/[0.85] rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#00D4FF] outline-none"
                                >
                                    <option value="" className="bg-[hsl(var(--card))]">Todas las conexiones</option>
                                    {connections.map(c => (
                                        <option key={c.id} value={c.id} className="bg-[hsl(var(--card))]">{c.name}</option>
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
