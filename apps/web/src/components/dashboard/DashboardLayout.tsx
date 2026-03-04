import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    FolderTree,
    Tag,
    Settings,
    Users,
    FileText,
    CreditCard,
    AlertTriangle,
    BarChart3,
    History,
    ShoppingBag,
    Truck,
    ShoppingCart,
    UserCog,
    ArrowRightLeft,
    Store,
} from 'lucide-react';
import { Logo } from '../ui/Logo';

interface DashboardLayoutProps {
    children: ReactNode;
}

const navigationGroups = [
    {
        title: 'Principal',
        items: [
            { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Ventas',
        items: [
            { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart },
            { name: 'Ventas', href: '/dashboard/sales', icon: History },
            { name: 'Cotizaciones', href: '/dashboard/quotes', icon: FileText },
            { name: 'Clientes', href: '/dashboard/clients', icon: Users },
        ]
    },
    {
        title: 'Catálogo e Inventario',
        items: [
            { name: 'Productos', href: '/dashboard/products', icon: Package },
            { name: 'Categorías', href: '/dashboard/categories', icon: FolderTree },
            { name: 'Marcas', href: '/dashboard/brands', icon: Tag },
            { name: 'Inventario', href: '/dashboard/inventory', icon: Warehouse },
            { name: 'Traspasos', href: '/dashboard/transfers', icon: ArrowRightLeft },
            { name: 'Stock Crítico', href: '/dashboard/reports/critical-stock', icon: AlertTriangle },
            { name: 'Tienda Online', href: '/dashboard/ecommerce', icon: ShoppingBag },
        ]
    },
    {
        title: 'Compras',
        items: [
            { name: 'Compras', href: '/dashboard/purchases', icon: ShoppingBag },
            { name: 'Proveedores', href: '/dashboard/suppliers', icon: Truck },
        ]
    },
    {
        title: 'Administración',
        items: [
            { name: 'Sucursales', href: '/dashboard/branches', icon: Store },
            { name: 'Personal', href: '/dashboard/users', icon: UserCog },
            { name: 'Créditos', href: '/dashboard/credits', icon: CreditCard },
            { name: 'Tesorería', href: '/dashboard/treasury', icon: BarChart3 },
            { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
        ]
    }
];

const flattenedNavigation = navigationGroups.flatMap(group => group.items);

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const location = useLocation();

    const isImpersonating = localStorage.getItem('impersonating') === 'true';

    const handleExitImpersonation = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('impersonating');
        window.location.href = '/login';
    };

    const isCollapsed = false; // Add state hook if sidebar collapsing is implemented

    return (
        <div className="min-h-screen bg-gray-50">
            {isImpersonating && (
                <div className="bg-purple-600 text-white px-4 py-2 text-center text-sm font-medium flex justify-center items-center gap-4 fixed top-0 w-full z-50 shadow-lg">
                    <span>🕵️ Estás viendo el sistema en modo Impersonation</span>
                    <button
                        onClick={handleExitImpersonation}
                        className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-purple-50 transition-colors"
                    >
                        Salir al Admin
                    </button>
                </div>
            )}
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 ${isImpersonating ? 'mt-10' : ''}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-gray-200">
                        <Logo variant="full" />
                        <span className="ml-2 px-2 py-1 text-[10px] font-bold bg-blue-100 text-blue-800 rounded uppercase">
                            Admin
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
                        {navigationGroups.map((group, groupIndex) => (
                            <div key={group.title} className={groupIndex !== 0 ? "mt-6" : ""}>
                                {!isCollapsed && (
                                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {group.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.href;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.href}
                                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5 mr-3" />
                                                {!isCollapsed && item.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">A</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">Admin</p>
                                <p className="text-xs text-gray-500">Tenant 1</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`pl-64 ${isImpersonating ? 'mt-10' : ''}`}>
                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="px-8 py-4">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {flattenedNavigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
