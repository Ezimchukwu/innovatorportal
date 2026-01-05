import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Access denied"
        description="You do not have permission to view this page on the AI Innovators Portal."
        canonical={`${window.location.origin}/unauthorized`}
      />
      <main className="container flex min-h-screen items-center justify-center py-10">
        <div className="max-w-md space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
            Access restricted
          </p>
          <h1 className="text-lg font-semibold text-foreground">You don&apos;t have permission to view this area.</h1>
          <p className="text-xs">
            This section is reserved for the Super Admin who manages approvals, payments and system-wide settings for
            the AI Innovators Platform.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="sm" className="text-xs">
              <Link to="/">Return to homepage</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link to="/auth">Go to login</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnauthorizedPage;
