import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

type ProjectRow = Tables<"projects">;

const fetchPublicProjects = async (): Promise<ProjectRow[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("visibility", "public")
    .eq("approved_by_admin", true)
    .eq("is_public_gallery", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const PublicGalleryPage = () => {
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ["public-projects"], queryFn: fetchPublicProjects });

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Public Projects Gallery"
        description="Browse real AI projects created by students in the AI Innovators Program across Nigeria and Africa."
        canonical={`${window.location.origin}/projects`}
      />
      <main className="container pb-16 pt-10">
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="text-xs"
          >
            ← Back
          </Button>
        </div>
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/70">
              Public Gallery
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Proof that African teens can build with AI.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Every project here was built by a student in the AI Young Innovators Program. Only admin-approved, public
              projects appear in this gallery.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-card px-3 py-1">Web Apps</span>
            <span className="rounded-full bg-card px-3 py-1">Chatbots</span>
            <span className="rounded-full bg-card px-3 py-1">Design &amp; Video</span>
          </div>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading student projects...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            We couldn&apos;t load the gallery right now. Please try again in a moment.
            <div className="mt-1 text-[11px] text-destructive/80">{(error as Error).message}</div>
          </div>
        )}

        {!isLoading && !isError && (projects?.length ?? 0) === 0 && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No public projects yet</p>
            <p className="mt-1 max-w-xl text-sm">
              Once students complete their work and the admin approves visibility, their projects will appear here as proof
              of learning.
            </p>
          </div>
        )}

        {!isLoading && !isError && (projects?.length ?? 0) > 0 && (
          <section className="grid gap-5 md:grid-cols-3">
            {projects!.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-secondary/80 px-2 py-1 font-semibold uppercase tracking-wide text-secondary-foreground">
                    {project.media_type.replace("_", " ")}
                  </span>
                  {project.cohort && <span>{project.cohort}</span>}
                </div>
                <h2 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                  {project.title}
                </h2>
                {project.description && (
                  <p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">{project.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted/70 px-2 py-1">Public · Student project</span>
                  {project.external_url ? (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="px-2 text-[11px] story-link"
                    >
                      <a href={project.external_url} target="_blank" rel="noreferrer">
                        View project
                      </a>
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/80">Linked project coming soon</span>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="mt-10 rounded-3xl border border-dashed border-border/80 bg-muted/60 p-5 text-sm text-muted-foreground">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                For Schools &amp; Parents
              </p>
              <p className="mt-2 max-w-xl text-sm">
                Want your students&apos; work featured here? We keep learning data private – only selected, admin-approved
                projects appear in this gallery.
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

