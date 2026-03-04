import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: ('TENANT_ADMIN' | 'CASHIER' | 'MANAGER' | 'SUPER_ADMIN')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
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

    return <Outlet />;
}
