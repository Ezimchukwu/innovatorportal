import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

const ADMIN_EMAIL = "divinetonyezimchukwu@gmail.com";

interface ProtectedRouteProps {
  requireRole?: "admin" | "parent" | "student" | "school";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireRole }) => {
  const { user, loading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const location = useLocation();

  const isChecking = loading || (!!requireRole && rolesLoading);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking your access...
      </div>
    );
  }

  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirectTo=${redirectTo}`} replace />;
  }

  if (
    requireRole &&
    !(
      roles.includes(requireRole as any) &&
      (requireRole !== "admin" || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    )
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-3xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">Access restricted</p>
          <p className="mt-2 text-sm text-foreground">You don&apos;t have permission to view this dashboard.</p>
          <p className="mt-1 text-xs">
            If you believe this is a mistake, please contact the AI Innovators Program team or your child&apos;s school.
          </p>
          <div className="mt-4 flex justify-end">
            <Link to="/" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

