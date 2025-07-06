import { createRoot } from 'react-dom/client'
import './index.css'
import { Layout } from './common/components/Layout'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// Guest-specific pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PropertyListing from "./pages/PropertyListing";
import NotFound from "./pages/NotFound";

const GuestSignup = lazy(() => import("./pages/guest/GuestSignup"));
const GuestBookings = lazy(() => import("./pages/guest/GuestBookings"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <div className="text-gray-600">Loading...</div>
    </div>
  </div>
);

function GuestApp() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/guest/signup" element={<GuestSignup />} />
          <Route path="/property/:id" element={<PropertyListing />} />
          <Route path="/guest/bookings" element={<GuestBookings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

createRoot(document.getElementById("root")!).render(<GuestApp />);
