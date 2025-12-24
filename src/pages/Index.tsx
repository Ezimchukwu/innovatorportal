import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/MainNavbar";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { getPrimaryDashboardPath } from "@/lib/roleRouting";

const Index = () => {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const primaryDashboardPath = getPrimaryDashboardPath(roles, "/parent");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Home"
        description="AI Innovators Portal showcases African youth building real AI projects with parent and school dashboards for tracking progress."
        canonical={window.location.origin}
      />
      <MainNavbar />

      <main className="container pb-24 pt-10 md:pt-16">
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Nigeria’s first AI project portfolio for teens
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                Where Young Minds Don&apos;t Just Learn AI — They Build With It.
              </h1>
              <p className="max-w-xl text-balance text-sm text-muted-foreground md:text-base">
                A trusted AI project portal where African students create real-world solutions, showcase their work publicly,
                and prove their skills through hands-on projects tracked by parents and schools.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/auth">Register a Child</Link>
              </Button>
              <Button
                size="lg"
                className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
              >
                Proof of Learning
              </Button>
              <Button
                asChild
                size="lg"
                className="hover-scale bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/projects">View student projects</Link>
              </Button>
            </div>

            <div className="grid gap-4 text-xs text-muted-foreground md:grid-cols-3">
              <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
                <p className="font-semibold text-foreground">For Schools</p>
                <p className="mt-1 leading-snug">Lightweight dashboards to track participation and showcase your school’s best work.</p>
              </div>
              <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
                <p className="font-semibold text-foreground">For Parents</p>
                <p className="mt-1 leading-snug">See progress, feedback, and certificates – only for your child.</p>
              </div>
              <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
                <p className="font-semibold text-foreground">For Students</p>
                <p className="mt-1 leading-snug">A portfolio of real AI projects you can share with the world.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-10 top-6 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative rounded-3xl border border-border/80 bg-card/90 p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Live student cohort</p>
                  <p className="text-sm font-semibold">AI Young Innovators – Lagos</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  42 active projects
                </div>
              </div>

              <div className="grid gap-3 text-xs">
                <div className="flex items-center justify-between rounded-2xl bg-muted/80 px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="font-medium">Chatbot for School Fees FAQs</p>
                    <p className="text-[11px] text-muted-foreground">Built by Junior Secondary 2, Abuja</p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    NLP
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/80 px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="font-medium">AI Career Guide for Teens</p>
                    <p className="text-[11px] text-muted-foreground">Virtual cohort · Pan-Nigeria</p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    Portfolio
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/80 px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="font-medium">Climate Story Visualizer</p>
                    <p className="text-[11px] text-muted-foreground">Senior Secondary 1, Ibadan</p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    Vision
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <p>Secure dashboards for parents, schools and students.</p>
                <p className="font-medium text-foreground">Built for Nigeria, open to Africa.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 border-t border-dashed border-border/70 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Trusted by forward-thinking schools</h2>
              <p className="mt-1 text-sm text-muted-foreground">Simple to adopt, no complex tech setup required.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
              <span className="rounded-full bg-card/80 px-3 py-1">Primary & Secondary Schools</span>
              <span className="rounded-full bg-card/80 px-3 py-1">After-school Programs</span>
              <span className="rounded-full bg-card/80 px-3 py-1">Virtual Cohorts</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="container flex flex-col gap-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} AI Innovators Program. Growing Africa’s next generation of builders.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/projects" className="hover:text-foreground">
              Public projects
            </Link>
            <span className="hidden h-4 w-px bg-border/70 md:inline-block" />
            <span>Built with privacy, safety and parent trust in mind.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
