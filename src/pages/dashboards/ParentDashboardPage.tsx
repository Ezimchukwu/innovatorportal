import { Seo } from "@/components/Seo";

export const ParentDashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Parent Dashboard"
        description="Track your child’s AI learning progress, projects and certificates securely."
        canonical={`${window.location.origin}/parent`}
      />
      <main className="container pb-12 pt-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Parent View</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your child’s AI journey</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is a preview of the parent dashboard. In the full system, parents will only see information linked to their
            approved child profile.
          </p>
        </header>
      </main>
    </div>
  );
};
