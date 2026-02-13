import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    CreditCard,
    Settings,
    Activity,
    Megaphone
} from 'lucide-react';

export default function SuperAdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (!user || user.role !== 'SUPER_ADMIN') {
        // Redirect if not super admin
        // return <Navigate to="/login" />;
        // Better to show unauthorized or redirect
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Tenants', path: '/admin/tenants' },
        { icon: CreditCard, label: 'Subscription Plans', path: '/admin/plans' },
        { icon: Activity, label: 'System Health', path: '/admin/system-health' },
        { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-neutral-900 text-white font-sans">
            {/* Sidebar - Dark/Inverted Theme */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } bg-black border-r border-neutral-800 flex flex-col transition-all duration-300 relative z-20`}
            >
                <div className="p-4 flex items-center justify-between border-b border-neutral-800 h-16">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-lg">
                                A
                            </div>
                            <span className="font-bold text-xl tracking-tight">NexoPOS <span className="text-purple-500 text-xs align-top">ADMIN</span></span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-lg mx-auto">
                            A
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors absolute -right-3 top-6 bg-neutral-900 border border-neutral-700"
                    >
                        {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <button
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                            ? 'bg-neutral-800 text-white shadow-lg shadow-purple-900/20 border border-neutral-700'
                                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                            }`}
                                    >
                                        <item.icon size={20} className={`${isActive ? 'text-purple-400' : 'text-neutral-500 group-hover:text-purple-400'}`} />
                                        {isSidebarOpen && (
                                            <span className="font-medium text-sm">{item.label}</span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-neutral-800">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium text-sm">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-900">
                <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-800 bg-black/50 backdrop-blur-sm">
                    <div>
                        <h2 className="text-white font-semibold">Panel de Super Administración</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700">
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">SA</div>
                            <span className="text-sm font-medium text-neutral-300">Super Admin</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
