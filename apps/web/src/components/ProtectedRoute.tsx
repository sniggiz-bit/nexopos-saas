import { canAccessModuleRoute } from '../lib/module-for-route';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: ('TENANT_ADMIN' | 'CASHIER' | 'MANAGER' | 'SUPER_ADMIN')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user) {
        if (!allowedRoles.includes(user.role)) {
            // User has a role but it's not allowed for this route
            if (user.role === 'CASHIER') {
                return <Navigate to="/pos" replace />;
            }
            if (user.role === 'TENANT_ADMIN') {
                return <Navigate to="/dashboard" replace />;
            }
            return <Navigate to="/" replace />;
        }
    }

    if (user && !canAccessModuleRoute(location.pathname, user.modules, user.role)) {
        return <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground"><section className="max-w-lg rounded-2xl border border-border bg-card p-8"><h1 className="text-xl font-semibold">Servicio deshabilitado</h1><p className="mt-3 text-muted-foreground">Este servicio no está habilitado para tu empresa. Contacta al administrador para solicitar su activación.</p><Link onClick={() => { if (user.role === 'CASHIER') logout(); }} to={user.role === 'CASHIER' ? '/login' : '/dashboard'} className="mt-5 inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-white">{user.role === 'CASHIER' ? 'Cerrar sesión' : 'Volver a mi panel'}</Link></section></div>;
    }
    return <Outlet />;
}
