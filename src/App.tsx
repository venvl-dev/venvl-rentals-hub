
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PropertyListing from "./pages/PropertyListing";
import GuestBookings from "./pages/GuestBookings";
import HostDashboard from "./pages/HostDashboard";
import AdminPanel from "./pages/AdminPanel";
import DataSeeding from "./pages/DataSeeding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/property/:id" element={<PropertyListing />} />
            <Route path="/guest/bookings" element={<GuestBookings />} />
            <Route path="/host/dashboard" element={<HostDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/seed-data" element={<DataSeeding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
