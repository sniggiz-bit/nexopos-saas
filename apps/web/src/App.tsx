import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TenantsPage from './pages/admin/TenantsPage';
import TenantDetailPage from './pages/admin/TenantDetailPage';
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
import { QuotePrintPage } from './pages/dashboard/QuotePrintPage';
import { CreditsPage } from './pages/dashboard/CreditsPage';
import { TreasuryPage } from './pages/dashboard/TreasuryPage';
import { CriticalStockPage } from './pages/dashboard/CriticalStockPage';
import BranchesPage from './pages/admin/BranchesPage';
import SuperAdminBranchesPage from './pages/admin/SuperAdminBranchesPage';
import NewTransferPage from './pages/admin/transfers/NewTransferPage';
import { EcommercePage } from './pages/dashboard/EcommercePage';
import { SsoLoginPage } from './pages/SsoLoginPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicStorePage } from './pages/store/PublicStorePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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

  // If not authenticated, show landing page
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

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
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/sso" element={<SsoLoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/store/:slug" element={<PublicStorePage />} />

              {/* Super Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/admin" element={<SuperAdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="tenants" element={<TenantsPage />} />
                  <Route path="tenants/:id" element={<TenantDetailPage />} />
                  <Route path="plans" element={<PlansPage />} />
                  <Route path="branches" element={<SuperAdminBranchesPage />} />
                  <Route path="system-health" element={<SystemHealthPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                </Route>
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']} />}>
                <Route path="/pos" element={
                  <CartProvider>
                    <PosPage />
                  </CartProvider>
                } />
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
                <Route path="/dashboard/quotes/new" element={
                  <CartProvider>
                    <CreateQuotePage />
                  </CartProvider>
                } />
                <Route path="/dashboard/quotes/:id/print" element={<QuotePrintPage />} />
                <Route path="/dashboard/credits" element={<CreditsPage />} />
                <Route path="/dashboard/treasury" element={<TreasuryPage />} />
                <Route path="/dashboard/reports/critical-stock" element={<CriticalStockPage />} />
                <Route path="/dashboard/branches" element={<BranchesPage />} />
                <Route path="/dashboard/transfers/new" element={<NewTransferPage />} />
                <Route path="/admin/transfers/new" element={<NewTransferPage />} /> {/* Alias */}
                <Route path="/dashboard/ecommerce" element={<EcommercePage />} />
                <Route path="/admin/ecommerce" element={<EcommercePage />} />
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
