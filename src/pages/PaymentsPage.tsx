import { MainNavbar } from "@/components/MainNavbar";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const PaymentsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Enrollment & Payments"
        description="Secure payment step for enrolling a child into the AI Innovators Program."
        canonical={`${window.location.origin}/payments`}
      />
      <MainNavbar />
      <main className="container pb-24 pt-10">
        <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Enroll a child into the AI Innovators Program
          </h1>
          <p className="text-sm text-muted-foreground">
            This is the secure payment step for parents and schools. Payment processing will be connected here so you can
            complete enrollment in a few clicks.
          </p>
          <p className="text-xs text-muted-foreground">
            For now, please continue to the signup page and our team will share payment instructions directly.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
            >
              <Link to="/auth">Continue to signup</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover-scale border-primary/30 bg-background text-primary hover:bg-muted/60"
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PaymentsPage;
