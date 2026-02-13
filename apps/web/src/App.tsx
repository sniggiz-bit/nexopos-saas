import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TenantsPage from './pages/admin/TenantsPage';
import PlansPage from './pages/admin/PlansPage';
import SystemHealthPage from './pages/admin/SystemHealthPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import { PosPage } from './pages/PosPage';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { InventoryPage } from './pages/dashboard/InventoryPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { BrandsPage } from './pages/dashboard/BrandsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { SalesHistoryPage } from './pages/dashboard/SalesHistoryPage';
import { ClientsPage } from './pages/dashboard/ClientsPage';
import { QuotesPage } from './pages/dashboard/QuotesPage';
import { CreateQuotePage } from './pages/dashboard/CreateQuotePage';
import { CreditsPage } from './pages/dashboard/CreditsPage';
import { TreasuryPage } from './pages/dashboard/TreasuryPage';
import { CriticalStockPage } from './pages/dashboard/CriticalStockPage';
import { SsoLoginPage } from './pages/SsoLoginPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/pos" replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          NexoPOS
        </h1>
        <p className="text-xl text-gray-600">
          Cargando...
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth/sso" element={<SsoLoginPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Super Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/admin" element={<SuperAdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="tenants" element={<TenantsPage />} />
                  <Route path="plans" element={<PlansPage />} />
                  <Route path="system-health" element={<SystemHealthPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                </Route>
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']} />}>
                <Route path="/pos" element={<PosPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/dashboard" element={<DashboardOverviewPage />} />
                <Route path="/dashboard/products" element={<ProductsPage />} />
                <Route path="/dashboard/inventory" element={<InventoryPage />} />
                <Route path="/dashboard/categories" element={<CategoriesPage />} />
                <Route path="/dashboard/brands" element={<BrandsPage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route path="/dashboard/sales" element={<SalesHistoryPage />} />
                <Route path="/dashboard/clients" element={<ClientsPage />} />
                <Route path="/dashboard/quotes" element={<QuotesPage />} />
                <Route path="/dashboard/quotes/new" element={<CreateQuotePage />} />
                <Route path="/dashboard/credits" element={<CreditsPage />} />
                <Route path="/dashboard/treasury" element={<TreasuryPage />} />
                <Route path="/dashboard/reports/critical-stock" element={<CriticalStockPage />} />
              </Route>

              {/* Default Redirect */}
              {/* Default Redirect - Handle Role Based Redirect */}
              <Route path="/" element={<RoleBasedRedirect />} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}


export default App;
