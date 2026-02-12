import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: ('ADMIN' | 'CASHIER' | 'USER')[];
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

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect based on role if they don't have permission
        if (user.role === 'CASHIER') {
            return <Navigate to="/pos" replace />;
        }
        if (user.role === 'ADMIN') {
            // If admin tries to access a restricted route (unlikely based on current logic, but safeguard)
            return <Navigate to="/dashboard" replace />;
        }
        // Default fallback
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
