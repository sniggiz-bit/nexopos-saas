import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    FolderTree,
    Tag,
    Settings,
    Receipt
} from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
}

const navigation = [
    { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Productos', href: '/dashboard/products', icon: Package },
    { name: 'Inventario', href: '/dashboard/inventory', icon: Warehouse },
    { name: 'Categorías', href: '/dashboard/categories', icon: FolderTree },
    { name: 'Marcas', href: '/dashboard/brands', icon: Tag },
    { name: 'Historial de Ventas', href: '/dashboard/sales', icon: Receipt },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-900">NexoPOS</h1>
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Admin
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
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
            <div className="pl-64">
                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="px-8 py-4">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
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
