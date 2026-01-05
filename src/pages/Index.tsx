import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/MainNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import heroTeenCoding from "@/assets/hero-teen-coding.jpg";
import heroKidsCollab from "@/assets/hero-kids-collab.jpg";
import heroTeenGame from "@/assets/hero-teen-game.jpg";
import heroStudentPresenting from "@/assets/hero-student-presenting.jpg";
import parent1 from "@/assets/testimonial-parent-1.jpg";
import parent2 from "@/assets/testimonial-parent-2.jpg";
import parent3 from "@/assets/testimonial-parent-3.jpg";
import parent4 from "@/assets/testimonial-parent-4.jpg";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

type ProjectSummary = Pick<
  Tables<"projects">,
  "id" | "title" | "description" | "media_type" | "thumbnail_url" | "external_url"
>;

const fetchFeaturedProjects = async (): Promise<ProjectSummary[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, description, media_type, thumbnail_url, external_url")
    .eq("visibility", "public")
    .eq("approved_by_admin", true)
    .eq("is_public_gallery", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return data ?? [];
};

const Index = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["home-featured-projects"],
    queryFn: fetchFeaturedProjects,
  });

  const testimonialPeople = [
    {
      image: parent1,
      name: "Mrs. Adeoye",
      role: "Parent",
      quote:
        "In three months my son went from watching YouTube tutorials to showing me real apps he built himself.",
    },
    {
      image: parent2,
      name: "Chioma O.",
      role: "Parent",
      quote:
        "This is the first program where I can log in and clearly see what my daughter is building each week.",
    },
    {
      image: parent3,
      name: "Mr. Ibrahim",
      role: "Parent",
      quote:
        "Her confidence changed when she presented her AI project to our family – it felt like watching her future open up.",
    },
    {
      image: parent4,
      name: "School Director, Abuja",
      role: "School Leader",
      quote:
        "The portal finally gives us evidence of learning, not just attendance. We now showcase projects at every PTA.",
    },
  ];

  const heroImages = [
    { src: heroTeenCoding, alt: "African teen focused on coding on a laptop in a bright classroom" },
    { src: heroKidsCollab, alt: "Group of African kids collaborating around a computer and smiling" },
    { src: heroTeenGame, alt: "Teenager building a game or web app on a laptop in a modern workspace" },
    { src: heroStudentPresenting, alt: "Student presenting a digital project on a large screen to classmates" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="AI Innovators – Real Projects, Real Outcomes"
        description="See what African kids actually build with AI – real web apps, games and digital projects validated by parents and schools."
        canonical={window.location.origin}
      />
      <MainNavbar />

      <main className="container pb-24 pt-8 md:pt-14">
        {/* HERO: Proof-first storytelling */}
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              Built in Nigeria. Trusted by parents and schools.
            </div>

            <div className="space-y-3">
              <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
                Proof over promises.
                <span className="block text-primary">Real projects your child actually ships.</span>
              </h1>
              <p className="max-w-xl text-balance text-sm text-muted-foreground">
                The AI Innovators Program is a project-first experience where African kids and teens build web apps,
                games and AI-powered ideas – with every project saved, tracked and visible to you.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Button
                asChild
                size="sm"
                className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/payments">Enroll your child</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hover-scale border-primary/40 bg-background text-primary hover:bg-primary/5"
              >
                <Link to="/projects">View student projects</Link>
              </Button>
            </div>

            <div className="grid gap-3 text-[11px] text-muted-foreground md:grid-cols-3">
              <div className="rounded-2xl bg-card/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground">Project evidence, not just scores</p>
                <p className="mt-1 leading-snug">
                  Track every build, submission and presentation your child completes in the portal.
                </p>
              </div>
              <div className="rounded-2xl bg-card/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground">Built for Nigerian schools</p>
                <p className="mt-1 leading-snug">Simple to deploy across classes without new hardware or complex setup.</p>
              </div>
              <div className="rounded-2xl bg-card/80 p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground">Parent and school dashboards</p>
                <p className="mt-1 leading-snug">One place where parents, teachers and students see the same progress.</p>
              </div>
            </div>
          </div>

          {/* Hero image grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {heroImages.map((image, index) => (
              <div
                key={image.alt}
                className={`group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1 ${
                  index === 1 || index === 2 ? "md:translate-y-4" : ""
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-44 lg:h-48"
                />
              </div>
            ))}
          </div>
        </section>

        {/* PROOF OVER PROMISES */}
        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                Proof Over Promises
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">What kids actually build</h2>
                  <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                    These are real projects from real African students – web apps, games, designs and videos built inside
                    the AI Innovators Program. No templates. No fake screenshots.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link to="/projects">See more projects</Link>
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-border/60 bg-muted/40">
                      <CardContent className="h-28" />
                    </Card>
                  ))}

                {!isLoading && projects.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground">
                    Public student projects will appear here as soon as they are approved. You can already explore the
                    live gallery.
                  </p>
                )}

                {!isLoading &&
                  projects.map((project) => (
                    <Card
                      key={project.id}
                      className="group flex h-full flex-col overflow-hidden border-border/70 bg-card/90 shadow-[var(--shadow-soft)]"
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src={project.thumbnail_url || heroTeenGame}
                          alt={project.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-success" />
                          {project.media_type.replace("_", " ")}
                        </div>
                      </div>
                      <CardContent className="flex flex-1 flex-col gap-1.5 p-3 text-xs">
                        <h3 className="line-clamp-2 text-[13px] font-semibold text-foreground">{project.title}</h3>
                        {project.description && (
                          <p className="line-clamp-3 text-[11px] text-muted-foreground">{project.description}</p>
                        )}
                        {project.external_url && (
                          <a
                            href={project.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-auto inline-flex items-center text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Open project
                            <span aria-hidden="true" className="ml-1">
                              ↗
                            </span>
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Side image and reassurance */}
            <aside className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)]">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={heroKidsCollab}
                  alt="Students collaborating around a laptop during the AI Innovators Program"
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                  How it works
                </p>
                <ul className="space-y-1.5">
                  <li>
                    <span className="font-medium text-foreground">1. Enroll</span> – secure payment and onboarding for
                    your child or school.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">2. Build</span> – weekly guided challenges where kids
                    ship real projects.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">3. Showcase</span> – selected work appears in the
                    public gallery and certificates.
                  </li>
                </ul>
                <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-[11px]">
                  <Badge variant="outline" className="border-success/40 text-success">
                    Transparent progress
                  </Badge>
                  <span>Every project is timestamped and linked to your child’s profile.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* TESTIMONIALS / SUCCESS STORIES */}
        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
              Success Stories
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">What parents &amp; schools are noticing</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Behind every login is a family, a classroom and a child discovering what they can build. These are their
              words.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {testimonialPeople.map((person) => (
              <article
                key={person.name}
                className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/95 p-4 text-xs text-muted-foreground shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={person.image}
                    alt={`${person.name} portrait`}
                    loading="lazy"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{person.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-accent-foreground/80">{person.role}</p>
                  </div>
                </div>
                <p className="leading-relaxed text-[11px]">“{person.quote}”</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="container flex flex-col gap-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} AI Innovators Program. Building Africa’s next generation of confident, practical
            problem solvers.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/projects" className="hover:text-foreground">
              Public projects gallery
            </Link>
            <span className="hidden h-4 w-px bg-border/70 md:inline-block" />
            <span>Designed with privacy, safety and parent trust at the centre.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
