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

// Host-specific pages
const HostSignup = lazy(() => import("./pages/host/HostSignup"));
const HostDashboard = lazy(() => import("./pages/host/HostDashboard"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <div className="text-gray-600">Loading...</div>
    </div>
  </div>
);

function HostApp() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/host/signup" element={<HostSignup />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['host']}>
                <HostDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/host/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['host']}>
                <HostDashboard />
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
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

createRoot(document.getElementById("root")!).render(<HostApp />);