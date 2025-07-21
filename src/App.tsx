import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";

// Public pages (loaded immediately for fast initial load)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PropertyListing from "./pages/PropertyListing";
import NotFound from "./pages/NotFound";

// Lazy-loaded components (code splitting)
const GuestSignup = lazy(() => import("./pages/guest/GuestSignup"));
const GuestBookings = lazy(() => import("./pages/guest/GuestBookings"));

const HostSignup = lazy(() => import("./pages/host/HostSignup"));
const HostDashboard = lazy(() => import("./pages/host/HostDashboard"));
const Calendar = lazy(() => import("./pages/Calendar"));

const SuperAdminLogin = lazy(() => import("./pages/admin/SuperAdminLogin"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const SystemSetup = lazy(() => import("./pages/admin/SystemSetup"));
const CreateTestUsers = lazy(() => import("./pages/admin/CreateTestUsers"));
const DataSeeding = lazy(() => import("./pages/admin/DataSeeding"));

// New Admin Dashboard Pages
const Settings = lazy(() => import("./pages/admin/Settings"));
const MetaManager = lazy(() => import("./pages/admin/MetaManager"));
const Users = lazy(() => import("./pages/admin/Users"));
const Roles = lazy(() => import("./pages/admin/Roles"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));

// Super Admin Routes
const SuperAdminPanel = lazy(() => import("./routes/admin/Panel"));
const UserManagement = lazy(() => import("./routes/admin/Users"));
const PropertyManagement = lazy(() => import("./routes/admin/Properties"));
const AmenityManagement = lazy(() => import("./routes/admin/Amenities"));
const PropertyTypeManagement = lazy(() => import("./routes/admin/PropertyTypes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <div className="text-gray-600">Loading...</div>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* === PUBLIC ROUTES === */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/property/:id" element={<PropertyListing />} />
                  
                  {/* === GUEST ROUTES (domain.com/guest/*) === */}
                  <Route path="/guest/signup" element={<GuestSignup />} />
                  <Route 
                    path="/guest/bookings" 
                    element={
                      <ProtectedRoute allowedRoles={["guest"]}>
                        <GuestBookings />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* === HOST ROUTES (domain.com/host/*) === */}
                  <Route path="/host/signup" element={<HostSignup />} />
                  <Route
                    path="/host"
                    element={
                      <ProtectedRoute allowedRoles={["host", "super_admin"]}>
                        <HostDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/host/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["host", "super_admin"]}>
                        <HostDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/host/calendar" 
                    element={
                      <ProtectedRoute allowedRoles={["host", "super_admin"]}>
                        <Calendar />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* === ADMIN ROUTES (domain.com/admin/*) === */}
                  <Route path="/admin/login" element={<SuperAdminLogin />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <SuperAdminPanel />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/panel" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <SuperAdminPanel />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <UserManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/properties" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <PropertyManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/amenities" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <AmenityManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/property-types" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <PropertyTypeManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/system-setup" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <SystemSetup />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/test-users" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <CreateTestUsers />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/data-seeding" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <DataSeeding />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* New Admin Dashboard Routes */}
                  <Route 
                    path="/admin/settings" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/meta" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <MetaManager />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/roles" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <Roles />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/audit" 
                    element={
                      <ProtectedRoute allowedRoles={["super_admin"]}>
                        <AuditLogs />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* === LEGACY ROUTES (for backwards compatibility) === */}
                  <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                  <Route path="/calendar" element={
                    <ProtectedRoute allowedRoles={["host", "super_admin"]}>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  
                  {/* === 404 === */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
