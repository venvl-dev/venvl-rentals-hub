import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useSecureQuery } from "@/hooks/useSecureApi";
// import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requireAuth = true,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    checkAuth();
  }, [authLoading, user?.id]);

  // Secure profile query hook
  const secureProfileQuery = useSecureQuery("profiles");

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Log access attempt
      console.log("Route access attempt by user:", user?.id);

      if (!user && requireAuth) {
        console.log("Unauthorized access attempt - no user session");
        toast.error("Please sign in to access this page");
        navigate(redirectTo);
        return;
      }

      if (!user && !requireAuth) {
        setAuthorized(true);
        return;
      }

      if (allowedRoles.length === 0) {
        setAuthorized(true);
        return;
      }

      const roleKey = `user_role_${user!.id}`;
      let cachedRole: string | null = null;
      let shouldUseCachedRole = false;

      try {
        const cached = localStorage.getItem(roleKey);
        if (cached) {
          const roleData = JSON.parse(cached);
          const isRecent = Date.now() - roleData.timestamp < 5 * 60 * 1000; // 5 minutes
          const isValidSession = roleData.sessionId === user!.id;

          if (isRecent && isValidSession) {
            cachedRole = roleData.role;
            shouldUseCachedRole = true;
          }
        }
      } catch (error) {
        console.warn("Error reading cached role:", error);
      }
      // If we have valid cached role and user has required permissions, allow immediate access
      if (
        shouldUseCachedRole &&
        cachedRole &&
        allowedRoles.includes(cachedRole)
      ) {
        setUserRole(cachedRole);
        setAuthorized(true);
        setLoading(false);
        return; // Exit early, skip the aggressive cache clearing
      }
      // SECURITY FIX: Always fetch fresh role for protected routes to prevent cache poisoning
      localStorage.removeItem(roleKey);

      // TEMPORARY DEBUG: Clear all role-related cache
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("user_role_")) {
          localStorage.removeItem(key);
        }
      });

      // Always fetch fresh role data for security-critical route access
      let role: string | null = null;
      try {
        // Direct query to profiles table - bypassing useSecureQuery due to issues
        const { data: profile, error } = await import(
          "@/integrations/supabase/client"
        ).then((module) =>
          module.supabase
            .from("profiles")
            .select("id, email, role")
            .eq("id", user!.id)
            .maybeSingle()
        );

        if (error) {
          console.error("Profile query error:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        if (profile) {
          role = profile?.role || null;
        }

        if (!role) {
          console.warn(
            "Profile not found for user:",
            user!.id,
            "- falling back to user metadata"
          );
          // SECURITY FIX: More restrictive fallback - don't trust user metadata for admin roles
          const fallbackRole = (user as any)?.user_metadata?.role || "guest";
          role = ["guest", "host"].includes(fallbackRole)
            ? fallbackRole
            : "guest";
        }

        console.log("Role resolved for user:", user!.id, "Role:", role);

        // SECURITY FIX: Store with secure cache format matching useUserRole
        const secureCache = {
          role,
          timestamp: Date.now(),
          sessionId: user!.id,
          checksum: btoa(role + user!.id).slice(0, 8),
        };
        localStorage.setItem(roleKey, JSON.stringify(secureCache));
      } catch (error) {
        console.error("Profile fetch error for user:", user!.id, error);

        // More detailed error handling
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }

        // Check if it's a database connection issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('connection') || errorMessage.includes('network')) {
          toast.error("Network error. Please check your connection and try again.");
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          toast.error("Access denied. Please contact support if this persists.");
        } else {
          toast.error("Unable to fetch user profile. Please try logging in again.");
        }

        // Don't navigate away immediately, give users a chance to retry
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setUserRole(role);

      // Check if user has required role
      if (role && allowedRoles.includes(role)) {
        console.log("Authorized access for user:", user!.id, "Role:", role);
        setAuthorized(true);
      } else {
        console.log(
          "Unauthorized access attempt for user:",
          user!.id,
          "Required:",
          allowedRoles.join(", "),
          "User has:",
          role
        );
        toast.error("You do not have permission to access this page");

        // Redirect based on user role
        switch (role) {
          case "host":
            navigate("/host/dashboard");
            break;
          case "super_admin":
            navigate("/admin/panel");
            break;
          case "guest":
          default:
            navigate("/");
            break;
        }
      }
    } catch (error) {
      console.error("Authentication check failed for user:", user?.id, error);
      toast.error("Authentication check failed");
      navigate(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <div className="text-gray-600">Verifying access...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Profile Loading Error</h1>
            <p className="text-gray-600 mb-6">
              There was an issue loading your profile. This could be due to a temporary network issue.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setLoading(true);
                  checkAuth();
                }}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium"
              >
                Go Home
              </button>
              <button
                onClick={() => {
                  // Clear local storage and try to re-authenticate
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-medium"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
