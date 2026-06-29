import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { MainNavbar } from "@/components/MainNavbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { getPrimaryDashboardPath } from "@/lib/roleRouting";

export const PendingAccessPage = () => {
  const { user, loading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || rolesLoading) return;

    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (roles.length > 0) {
      navigate(getPrimaryDashboardPath(roles, "/student"), { replace: true });
    }
  }, [loading, rolesLoading, roles, user, navigate]);

  if (loading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Preparing your access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles.length > 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Access pending"
        description="Your account is registered and waiting for activation by the admin team."
        canonical={`${window.location.origin}/access-pending`}
      />
      <MainNavbar />
      <main className="container flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Account waiting for activation</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Your account is registered successfully.
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Your student dashboard will be activated by the platform admin once your account is reviewed. Please keep your
            account ID safe and share it with the team if they ask for it.
          </p>

          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/60 p-4 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">Your user ID</p>
            <p className="mt-2 break-all font-mono text-sm text-foreground">{user.id}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="sm" className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/payments">Complete enrollment payment</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PendingAccessPage;
