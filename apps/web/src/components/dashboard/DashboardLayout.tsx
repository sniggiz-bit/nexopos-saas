import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, Warehouse, FolderTree, Tag,
    Settings, Users, FileText, CreditCard, AlertTriangle,
    BarChart3, History, ShoppingBag, Truck, ShoppingCart,
    UserCog, ArrowRightLeft, Store, LogOut, Wifi, Plug,
    ChevronRight, Bell, Search, Award, Menu, X,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { SupportChatWidget } from './SupportChatWidget';

interface DashboardLayoutProps {
    children: ReactNode;
}

const navigationGroups = [
    {
        title: 'Principal',
        items: [
            { name: 'Resumen',        href: '/dashboard',                        icon: LayoutDashboard },
        ],
    },
    {
        title: 'Ventas',
        items: [
            { name: 'Punto de Venta', href: '/pos',                              icon: ShoppingCart },
            { name: 'Ventas',         href: '/dashboard/sales',                  icon: History },
            { name: 'Cotizaciones',   href: '/dashboard/quotes',                 icon: FileText },
            { name: 'Clientes',       href: '/dashboard/clients',                icon: Users },
        ],
    },
    {
        title: 'Catálogo e Inventario',
        items: [
            { name: 'Productos',      href: '/dashboard/products',               icon: Package },
            { name: 'Categorías',     href: '/dashboard/categories',             icon: FolderTree },
            { name: 'Marcas',         href: '/dashboard/brands',                 icon: Tag },
            { name: 'Inventario',     href: '/dashboard/inventory',              icon: Warehouse },
            { name: 'Traspasos',      href: '/dashboard/transfers',              icon: ArrowRightLeft },
            { name: 'Stock Crítico',  href: '/dashboard/reports/critical-stock', icon: AlertTriangle },
            { name: 'Tienda Online',  href: '/dashboard/ecommerce',              icon: ShoppingBag },
            { name: 'Integraciones',  href: '/dashboard/integrations',           icon: Plug },
        ],
    },
    {
        title: 'Compras',
        items: [
            { name: 'Compras',        href: '/dashboard/purchases',              icon: ShoppingBag },
            { name: 'Proveedores',    href: '/dashboard/suppliers',              icon: Truck },
        ],
    },
    {
        title: 'Administración',
        items: [
            { name: 'Suscripción',    href: '/dashboard/subscription',           icon: Award },
            { name: 'Sucursales',     href: '/dashboard/branches',               icon: Store },
            { name: 'Personal',       href: '/dashboard/users',                  icon: UserCog },
            { name: 'Créditos',       href: '/dashboard/credits',                icon: CreditCard },
            { name: 'Tesorería',      href: '/dashboard/treasury',               icon: BarChart3 },
            { name: 'Configuración',  href: '/dashboard/settings',               icon: Settings },
            { name: 'Transbank',      href: '/dashboard/transbank',              icon: Wifi },
        ],
    },
];

const flattenedNavigation = navigationGroups.flatMap(g => g.items);

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const location         = useLocation();
    const { user, logout } = useAuth();
    const isImpersonating  = localStorage.getItem('impersonating') === 'true';
    const [searchQuery, setSearchQuery]   = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleExitImpersonation = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('impersonating');
        window.location.href = '/login';
    };

    const currentPage = flattenedNavigation.find(item => item.href === location.pathname);
    const currentIcon = currentPage ? currentPage.icon : LayoutDashboard;
    const CurrentIcon = currentIcon;

    return (
        <div className="min-h-screen dark" style={{ background: 'hsl(220,30%,6%)' }}>

            {/* Impersonation banner */}
            {isImpersonating && (
                <div className="fixed top-0 w-full z-50 flex justify-center items-center gap-4 px-4 py-2 text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(90deg,#7c3aed,#6d28d9)' }}>
                    <span>🕵️ Modo Impersonation activo</span>
                    <button
                        onClick={handleExitImpersonation}
                        className="bg-white text-purple-700 px-3 py-0.5 rounded-full text-xs font-bold hover:bg-purple-50 transition-colors"
                    >
                        Salir al Admin
                    </button>
                </div>
            )}

            {/* ──────────────────────────────────────────────────────
                SIDEBAR
            ────────────────────────────────────────────────────── */}
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 w-60 flex flex-col z-40 transform transition-transform duration-300 lg:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } ${isImpersonating ? 'mt-10' : ''}`}
                style={{
                    background: 'linear-gradient(180deg, hsl(220,30%,7%) 0%, hsl(220,28%,6%) 100%)',
                    borderRight: '1px solid rgba(0,212,255,0.08)',
                }}
            >
                {/* ── Logo area ── */}
                <div className="flex items-center justify-between gap-2.5 h-16 px-5 shrink-0"
                    style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
                    <div className="flex items-center gap-2">
                        <Logo variant="full" mode="dark" />
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
                            style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                            Pro
                        </span>
                    </div>
                    {/* Mobile close button */}
                    <button 
                        className="lg:hidden p-1.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-6">
                    {navigationGroups.map((group) => (
                        <div key={group.title}>
                            <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                                style={{ color: 'rgba(0,212,255,0.35)' }}>
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                                    const isActive = location.pathname === item.href;
                                    const Icon     = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={[
                                                'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group',
                                                isActive ? 'nav-active-bar' : '',
                                            ].join(' ')}
                                            style={isActive ? {
                                                background: 'linear-gradient(90deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%)',
                                                color: '#00D4FF',
                                            } : {
                                                color: 'rgba(180,195,220,0.6)',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isActive) {
                                                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.05)';
                                                    (e.currentTarget as HTMLElement).style.color = 'rgba(180,195,220,0.9)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isActive) {
                                                    (e.currentTarget as HTMLElement).style.background = '';
                                                    (e.currentTarget as HTMLElement).style.color = 'rgba(180,195,220,0.6)';
                                                }
                                            }}
                                            onClick={() => setIsSidebarOpen(false)}
                                        >
                                            <Icon
                                                className="w-4 h-4 shrink-0 transition-all duration-150"
                                                style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' } : {}}
                                            />
                                            <span className="truncate">{item.name}</span>
                                            {isActive && (
                                                <ChevronRight className="w-3 h-3 ml-auto opacity-60 shrink-0" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── User footer ── */}
                <div className="p-3 shrink-0"
                    style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors"
                        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
                            style={{ background: 'linear-gradient(135deg,#00D4FF 0%,#0099BB 100%)', color: '#0B0F1A' }}>
                            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold truncate" style={{ color: 'rgba(210,225,245,0.95)' }}>
                                {user?.name || user?.email}
                            </p>
                            <p className="text-[10px] capitalize truncate" style={{ color: 'rgba(0,212,255,0.5)' }}>
                                {user?.role?.replace(/_/g, ' ').toLowerCase()}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar sesión"
                            className="p-1.5 rounded-lg transition-all duration-150"
                            style={{ color: 'rgba(180,195,220,0.4)' }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.color = '#ff6b6b';
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,107,107,0.1)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.color = 'rgba(180,195,220,0.4)';
                                (e.currentTarget as HTMLElement).style.background = '';
                            }}
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ──────────────────────────────────────────────────────
                MAIN CONTENT
            ────────────────────────────────────────────────────── */}
            <div className={`transition-all duration-300 lg:pl-60 ${isImpersonating ? 'mt-10' : ''} min-h-screen flex flex-col`}>

                {/* ── Top Header ── */}
                <header className="sticky top-0 z-10 flex items-center gap-4 px-4 md:px-8 h-16 shrink-0"
                    style={{
                        background: 'rgba(11,15,26,0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(0,212,255,0.08)',
                    }}>

                    {/* Mobile menu toggle */}
                    <button 
                        className="lg:hidden p-2 -ml-2 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Page breadcrumb */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CurrentIcon className="w-4 h-4 shrink-0 hidden sm:block" style={{ color: '#00D4FF' }} />
                        <h2 className="text-[15px] font-semibold truncate" style={{ color: 'rgba(210,225,245,0.9)' }}>
                            {currentPage?.name || 'Dashboard'}
                        </h2>
                    </div>

                    {/* Search bar */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg w-52"
                        style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                        <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(0,212,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent text-[13px] outline-none w-full placeholder:text-opacity-40"
                            style={{ color: 'rgba(210,225,245,0.8)', caretColor: '#00D4FF' }}
                        />
                    </div>

                    {/* Notification bell */}
                    <button className="relative p-2 rounded-lg transition-all duration-150"
                        style={{ color: 'rgba(180,195,220,0.5)', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#00D4FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(180,195,220,0.5)'}
                    >
                        <Bell className="w-4 h-4" />
                    </button>
                </header>

                {/* ── Page Content ── */}
                <main className="flex-1 p-4 md:p-8 animate-fade-up overflow-x-hidden">
                    {children}
                </main>

                <SupportChatWidget />
            </div>
        </div>
    );
}
