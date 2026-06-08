import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    LayoutDashboard,
    LogOut,
    CreditCard,
    Activity,
    Megaphone,
    GitBranch,
    Globe,
    ChevronRight,
    Bell,
    Search,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export default function SuperAdminLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    const navigationGroups = [
        {
            title: 'Principal',
            items: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
            ],
        },
        {
            title: 'SaaS & Clientes',
            items: [
                { name: 'Tenants', path: '/admin/tenants', icon: Users },
                { name: 'Sucursales', path: '/admin/branches', icon: GitBranch },
                { name: 'Planes', path: '/admin/plans', icon: CreditCard },
                { name: 'Módulos SaaS', path: '/admin/modules', icon: Activity },
            ],
        },
        {
            title: 'Plataforma',
            items: [
                { name: 'System Health', path: '/admin/system-health', icon: Activity },
                { name: 'Comunicados', path: '/admin/announcements', icon: Megaphone },
                { name: 'Landing Page', path: '/admin/landing', icon: Globe },
            ],
        },
    ];

    const flattenedNavigation = navigationGroups.flatMap(g => g.items);
    const currentPage = flattenedNavigation.find(item => item.path === location.pathname);
    const CurrentIcon = currentPage ? currentPage.icon : LayoutDashboard;

    return (
        <div className="min-h-screen dark" style={{ background: 'hsl(220,30%,6%)' }}>
            {/* ──────────────────────────────────────────────────────
                SIDEBAR
            ────────────────────────────────────────────────────── */}
            <aside
                className="fixed inset-y-0 left-0 w-60 flex flex-col z-20"
                style={{
                    background: 'linear-gradient(180deg, hsl(220,30%,7%) 0%, hsl(220,28%,6%) 100%)',
                    borderRight: '1px solid rgba(0,212,255,0.08)',
                }}
            >
                {/* ── Logo area ── */}
                <div className="flex items-center gap-2.5 h-16 px-5 shrink-0"
                    style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
                    <Logo variant="full" mode="dark" />
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
                        style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                        SUPERADMIN
                    </span>
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
                                    const isActive = location.pathname.startsWith(item.path);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
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
                            {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold truncate" style={{ color: 'rgba(210,225,245,0.95)' }}>
                                {user?.name || user?.email || 'Super Admin'}
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
            <div className="pl-60 min-h-screen flex flex-col">
                {/* ── Top Header ── */}
                <header className="sticky top-0 z-10 flex items-center gap-4 px-8 h-16 shrink-0"
                    style={{
                        background: 'rgba(11,15,26,0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(0,212,255,0.08)',
                    }}>

                    {/* Page breadcrumb */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CurrentIcon className="w-4 h-4 shrink-0" style={{ color: '#00D4FF' }} />
                        <h2 className="text-[15px] font-semibold truncate" style={{ color: 'rgba(210,225,245,0.9)' }}>
                            {currentPage?.name || 'Panel Principal'}
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
                <main className="flex-1 p-8 animate-fade-up overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
