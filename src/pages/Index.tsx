import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/MainNavbar";
import heroTeens from "@/assets/hero-african-teens.png";
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
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center animate-fade-in">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Nigeria’s first AI project portfolio for teens
            </div>
            <div className="space-y-3">
              <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
                Where Young Minds Don&apos;t Just Learn AI — They Build With It.
              </h1>
              <p className="max-w-xl text-balance text-sm text-muted-foreground">
                A trusted AI project portal where African students create real-world solutions, showcase their work publicly,
                and prove their skills through hands-on projects tracked by parents and schools.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Button
                asChild
                size="sm"
                className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/payments">Register a Child</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/projects">Proof of Learning</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hover-scale bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/projects">View student projects</Link>
              </Button>
            </div>

            <div className="grid gap-3 text-[11px] text-muted-foreground md:grid-cols-3">
              <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground">For Schools</p>
                <p className="mt-1 leading-snug">
                  Lightweight dashboards to track participation and showcase your school’s best work.
                </p>
              </div>
              <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground">For Parents</p>
                <p className="mt-1 leading-snug">See progress, feedback, and certificates – only for your child.</p>
              </div>
              <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground">For Students</p>
                <p className="mt-1 leading-snug">A portfolio of real AI projects you can share with the world.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-10 top-6 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-[var(--shadow-soft)]">
              <img
                src={heroTeens}
                alt="African teenagers collaborating on AI projects with laptops and tablets"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Trusted by forward-thinking schools</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Simple to adopt, no complex tech setup required.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground">
              <span className="rounded-full bg-card/80 px-3 py-1">Primary &amp; Secondary Schools</span>
              <span className="rounded-full bg-card/80 px-3 py-1">After-school Programs</span>
              <span className="rounded-full bg-card/80 px-3 py-1">Virtual Cohorts</span>
            </div>
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
              Success Stories
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">What Parents &amp; Teachers Say</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Real transformations from real families and schools across Nigeria.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {["Parent in Lagos", "School owner in Abuja", "Student in Ibadan"].map((label, index) => (
              <article
                key={label}
                className="group flex flex-col overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={heroTeens}
                    alt="African teens learning with technology in the AI Innovators Program"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 text-xs text-muted-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {label}
                  </p>
                  <p>
                    {index === 0 &&
                      "My daughter now explains AI concepts to me using the projects she built on this portal. It feels practical, not abstract."}
                    {index === 1 &&
                      "The dashboard makes it easy to see which students are actually building and presenting. It has raised our standard."}
                    {index === 2 &&
                      "Before this program, I only watched AI videos online. Now I have real projects I can show to universities."}
                  </p>
                </div>
              </article>
            ))}
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
