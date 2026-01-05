import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

export const SuperAdminGuard: React.FC = () => {
  const { user, loading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const location = useLocation();

  const isChecking = loading || rolesLoading;

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking secure admin access…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname + location.search }} replace />;
  }

  const isSuperAdmin = roles.includes("super_admin" as any);

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
