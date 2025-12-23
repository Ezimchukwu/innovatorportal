import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockProjects = [
  {
    id: 1,
    title: "AI Storyteller in Yoruba & English",
    school: "Queensfield College, Lagos",
    type: "Web App",
    cohort: "April 2025 Virtual",
    visibility: "public",
  },
  {
    id: 2,
    title: "Traffic Safety Bot for Kids",
    school: "Grace High School, Abuja",
    type: "Chatbot",
    cohort: "School-based",
    visibility: "public",
  },
  {
    id: 3,
    title: "Climate Change Poster – AI Generated Visuals",
    school: "Riverside Academy, Port Harcourt",
    type: "Design",
    cohort: "Holiday Bootcamp",
    visibility: "public",
  },
];

export const PublicGalleryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Public Projects Gallery"
        description="Browse real AI projects created by students in the AI Innovators Program across Nigeria and Africa."
        canonical={`${window.location.origin}/projects`}
      />
      <main className="container pb-16 pt-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/70">
              Public Gallery
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Proof that African teens can build with AI.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Every project here was built by a student in the AI Young Innovators Program. No stock demos – just real work
              from classrooms and virtual cohorts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-card px-3 py-1">Web Apps</span>
            <span className="rounded-full bg-card px-3 py-1">Chatbots</span>
            <span className="rounded-full bg-card px-3 py-1">Design & Video</span>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {mockProjects.map((project) => (
            <article
              key={project.id}
              className="group flex flex-col rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full bg-secondary/80 px-2 py-1 font-semibold uppercase tracking-wide text-secondary-foreground">
                  {project.type}
                </span>
                <span>{project.cohort}</span>
              </div>
              <h2 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {project.title}
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">{project.school}</p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="rounded-full bg-muted/70 px-2 py-1">Public · Student project</span>
                <Button size="sm" variant="ghost" className="px-2 text-[11px]">
                  View project
                </Button>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-dashed border-border/80 bg-muted/60 p-5 text-sm text-muted-foreground">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                For Schools & Parents
              </p>
              <p className="mt-2 max-w-xl text-sm">
                Want your students’ work featured here? We keep learning data private – only selected, approved projects appear
                in this gallery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" variant="hero">
                <Link to="/school">Partner as a School</Link>
              </Button>
              <Button asChild size="sm" variant="pill">
                <Link to="/parent">Register a Child</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
