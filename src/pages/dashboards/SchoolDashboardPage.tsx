import { Seo } from "@/components/Seo";

export const SchoolDashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="School Dashboard"
        description="Manage students, cohorts and AI projects for your school in a light, simple portal."
        canonical={`${window.location.origin}/school`}
      />
      <main className="container pb-12 pt-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">School Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Overview of your AI Innovators</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is a preview of the school dashboard. Bulk student creation, attendance and export features will connect to
            the backend in the next step.
          </p>
        </header>
      </main>
    </div>
  );
};
