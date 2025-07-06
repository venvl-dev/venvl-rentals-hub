import { createRoot } from 'react-dom/client'
import './index.css'
import { Layout } from './common/components/Layout'
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";

// Shared pages
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Calendar from "./pages/Calendar";

// Admin-specific pages
const SuperAdminLogin = lazy(() => import("./pages/admin/SuperAdminLogin"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const SystemSetup = lazy(() => import("./pages/admin/SystemSetup"));
const CreateTestUsers = lazy(() => import("./pages/admin/CreateTestUsers"));
const DataSeeding = lazy(() => import("./pages/admin/DataSeeding"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <div className="text-gray-600">Loading...</div>
    </div>
  </div>
);

function AdminApp() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          
          {/* Protected admin routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/panel" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute allowedRoles={['host', 'super_admin']}>
                <Calendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/system-setup" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SystemSetup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-test-users" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <CreateTestUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/data-seeding" 
            element={
              <ProtectedRoute>
                <DataSeeding />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

createRoot(document.getElementById("root")!).render(<AdminApp />);