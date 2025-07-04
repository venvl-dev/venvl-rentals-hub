
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import HostSignup from "./pages/HostSignup";
import GuestSignup from "./pages/GuestSignup";
import PropertyListing from "./pages/PropertyListing";
import HostDashboard from "./pages/HostDashboard";
import GuestBookings from "./pages/GuestBookings";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import SystemSetup from "./pages/SystemSetup";
import CreateTestUsers from "./pages/CreateTestUsers";
import DataSeeding from "./pages/DataSeeding";
import Calendar from "./pages/Calendar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/host/signup" element={<HostSignup />} />
              <Route path="/guest/signup" element={<GuestSignup />} />
              <Route path="/property/:id" element={<PropertyListing />} />
              
              {/* Protected routes */}
              <Route 
                path="/host/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['host']}>
                    <HostDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/guest/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['guest']}>
                    <GuestBookings />
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
                path="/admin/panel" 
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              
              {/* Development/Testing routes - require authentication but no specific role */}
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
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
