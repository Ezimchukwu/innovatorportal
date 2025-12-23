import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Student Dashboard"
        description="View assigned AI projects, upload work and track certificate status in the AI Innovators Portal."
        canonical={`${window.location.origin}/student`}
      />
      <main className="container pb-12 pt-10">
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-xs"
          >
            ← Back
          </Button>
        </div>
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Student Space</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your AI projects and assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is a preview of the student dashboard. In the full version, access will be secured by login and role-based
            permissions.
          </p>
        </header>
      </main>
    </div>
  );
};
