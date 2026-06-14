import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TenantsPage from './pages/admin/TenantsPage';
import TenantDetailPage from './pages/admin/TenantDetailPage';
import PlansPage from './pages/admin/PlansPage';
import SystemHealthPage from './pages/admin/SystemHealthPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import AdminLandingPage from './pages/admin/AdminLandingPage';
import AdminModulesPage from './pages/admin/AdminModulesPage';
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
import { IntegrationsPage } from './pages/dashboard/IntegrationsPage';
import { SsoLoginPage } from './pages/SsoLoginPage';
import { SuppliersPage } from './pages/dashboard/SuppliersPage';
import { PurchasesPage } from './pages/dashboard/PurchasesPage';
import { TransfersPage } from './pages/dashboard/transfers/TransfersPage';
import { UsersPage } from './pages/dashboard/users/UsersPage';
import { TransbankConfigPage } from './pages/dashboard/TransbankConfigPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicStorePage } from './pages/store/PublicStorePage';
import { SubscriptionPage } from './pages/dashboard/SubscriptionPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { ThemeProvider } from './context/ThemeContext';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RealtimeSync() {
  useRealtimeSync();
  return null;
}

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

  return <Navigate to="/dashboard" replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(0,212,255,0.1)' }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: '#00D4FF' }} />
          <div className="absolute inset-2 rounded-full" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgba(0,212,255,0.6)' }}>Cargando NexoPOS...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeSync />
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
                  <Route path="landing" element={<AdminLandingPage />} />
                  <Route path="modules" element={<AdminModulesPage />} />
                </Route>
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN', 'CASHIER', 'MANAGER']} />}>
                <Route path="/pos" element={
                  <CartProvider>
                    <PosPage />
                  </CartProvider>
                } />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN', 'MANAGER']} />}>
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
                <Route path="/dashboard/users" element={<UsersPage />} />
                <Route path="/dashboard/transfers/new" element={<NewTransferPage />} />
                <Route path="/admin/transfers/new" element={<NewTransferPage />} /> {/* Alias */}
                <Route path="/dashboard/ecommerce" element={<EcommercePage />} />
                <Route path="/dashboard/integrations" element={<IntegrationsPage />} />
                <Route path="/admin/ecommerce" element={<EcommercePage />} />
                <Route path="/dashboard/suppliers" element={<SuppliersPage />} />
                <Route path="/dashboard/purchases" element={<PurchasesPage />} />
                <Route path="/dashboard/transfers" element={<TransfersPage />} />
                <Route path="/dashboard/transbank" element={<TransbankConfigPage />} />
                <Route path="/dashboard/subscription" element={<SubscriptionPage />} />
              </Route>

              {/* Default Redirect */}
              {/* Default Redirect - Handle Role Based Redirect */}
              <Route path="/" element={<RoleBasedRedirect />} />
            </Routes>
          </Suspense>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              success: {
                iconTheme: { primary: '#34D399', secondary: 'hsl(var(--card))' },
              },
              error: {
                iconTheme: { primary: '#F87171', secondary: 'hsl(var(--card))' },
              },
            }}
          />
        </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


export default App;
