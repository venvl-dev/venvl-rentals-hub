
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/host/signup" element={<HostSignup />} />
              <Route path="/guest/signup" element={<GuestSignup />} />
              <Route path="/property/:id" element={<PropertyListing />} />
              <Route path="/host/dashboard" element={<HostDashboard />} />
              <Route path="/guest/bookings" element={<GuestBookings />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/admin/panel" element={<AdminPanel />} />
              <Route path="/system-setup" element={<SystemSetup />} />
              <Route path="/create-test-users" element={<CreateTestUsers />} />
              <Route path="/data-seeding" element={<DataSeeding />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
