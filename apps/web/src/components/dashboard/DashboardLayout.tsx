import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, Warehouse, FolderTree, Tag,
    Settings, Users, FileText, CreditCard, AlertTriangle,
    BarChart3, History, ShoppingBag, Truck, ShoppingCart,
    UserCog, ArrowRightLeft, Store, LogOut,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '@/context/AuthContext';

interface DashboardLayoutProps {
    children: ReactNode;
}

const navigationGroups = [
    {
        title: 'Principal',
        items: [
            { name: 'Resumen',        href: '/dashboard',              icon: LayoutDashboard },
        ],
    },
    {
        title: 'Ventas',
        items: [
            { name: 'Punto de Venta', href: '/pos',                    icon: ShoppingCart },
            { name: 'Ventas',         href: '/dashboard/sales',        icon: History },
            { name: 'Cotizaciones',   href: '/dashboard/quotes',       icon: FileText },
            { name: 'Clientes',       href: '/dashboard/clients',      icon: Users },
        ],
    },
    {
        title: 'Catálogo e Inventario',
        items: [
            { name: 'Productos',      href: '/dashboard/products',     icon: Package },
            { name: 'Categorías',     href: '/dashboard/categories',   icon: FolderTree },
            { name: 'Marcas',         href: '/dashboard/brands',       icon: Tag },
            { name: 'Inventario',     href: '/dashboard/inventory',    icon: Warehouse },
            { name: 'Traspasos',      href: '/dashboard/transfers',    icon: ArrowRightLeft },
            { name: 'Stock Crítico',  href: '/dashboard/reports/critical-stock', icon: AlertTriangle },
            { name: 'Tienda Online',  href: '/dashboard/ecommerce',    icon: ShoppingBag },
        ],
    },
    {
        title: 'Compras',
        items: [
            { name: 'Compras',        href: '/dashboard/purchases',    icon: ShoppingBag },
            { name: 'Proveedores',    href: '/dashboard/suppliers',    icon: Truck },
        ],
    },
    {
        title: 'Administración',
        items: [
            { name: 'Sucursales',     href: '/dashboard/branches',     icon: Store },
            { name: 'Personal',       href: '/dashboard/users',        icon: UserCog },
            { name: 'Créditos',       href: '/dashboard/credits',      icon: CreditCard },
            { name: 'Tesorería',      href: '/dashboard/treasury',     icon: BarChart3 },
            { name: 'Configuración',  href: '/dashboard/settings',     icon: Settings },
        ],
    },
];

const flattenedNavigation = navigationGroups.flatMap(g => g.items);

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const location  = useLocation();
    const { user, logout } = useAuth();

    const isImpersonating = localStorage.getItem('impersonating') === 'true';

    const handleExitImpersonation = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('impersonating');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-surface-raised dark:bg-background">
            {/* Impersonation banner */}
            {isImpersonating && (
                <div className="bg-purple-600 text-white px-4 py-2 text-center text-sm font-medium flex justify-center items-center gap-4 fixed top-0 w-full z-50 shadow-lg">
                    <span>🕵️ Modo Impersonation activo</span>
                    <button
                        onClick={handleExitImpersonation}
                        className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-purple-50 transition-colors"
                    >
                        Salir al Admin
                    </button>
                </div>
            )}

            {/* ── Sidebar ── */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-background border-r border-border flex flex-col ${isImpersonating ? 'mt-10' : ''}`}>

                {/* Logo */}
                <div className="flex items-center h-16 px-6 border-b border-border shrink-0">
                    <Logo variant="full" />
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded uppercase tracking-wide">
                        Admin
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-5">
                    {navigationGroups.map((group) => (
                        <div key={group.title}>
                            <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                                    const isActive = location.pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={[
                                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                            ].join(' ')}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-4 border-t border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary-foreground">
                                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {user?.name || user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {user?.role?.replace(/_/g, ' ').toLowerCase()}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar sesión"
                            className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger-subtle rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className={`pl-64 ${isImpersonating ? 'mt-10' : ''}`}>
                {/* Top header */}
                <header className="bg-background border-b border-border sticky top-0 z-10">
                    <div className="px-8 py-4">
                        <h2 className="text-xl font-bold text-foreground">
                            {flattenedNavigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
