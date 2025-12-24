import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Admin Control Panel"
        description="Approve users, manage roles, projects and payments for the AI Innovators Portal."
        canonical={`${window.location.origin}/admin`}
      />
      <main className="container pb-24 pt-10">
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs"
          >
            ← Back
          </Button>
        </div>
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Super Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Control centre (frontend preview)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is a read-only preview of the admin panel layout. Role-based access control, approvals and payment
            verification will be wired to the backend using Lovable Cloud.
          </p>
        </header>
      </main>
    </div>
  );
};
