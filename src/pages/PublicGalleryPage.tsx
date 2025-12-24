import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/MainNavbar";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

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
  const navigate = useNavigate();
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ["public-projects"], queryFn: fetchPublicProjects });

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  const mediaTypes = ["all", ...Array.from(new Set((projects ?? []).map((p) => p.media_type)))];
  const cohorts = ["all", ...Array.from(new Set((projects ?? []).map((p) => p.cohort).filter(Boolean)))] as string[];

  const filtered = (projects ?? []).filter((project) => {
    const matchesType = typeFilter === "all" || project.media_type === typeFilter;
    const schoolCategory = project.school_id ? "partner" : "independent";
    const matchesSchool = schoolFilter === "all" || schoolFilter === schoolCategory;
    const matchesCohort = cohortFilter === "all" || project.cohort === cohortFilter;
    return matchesType && matchesSchool && matchesCohort;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Public Projects Gallery"
        description="Browse real AI projects created by students in the AI Innovators Program across Nigeria and Africa."
        canonical={`${window.location.origin}/projects`}
      />
      <MainNavbar />
      <main className="container pb-16 pt-10">
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
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
          <div className="flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:gap-4">
            <div className="flex flex-wrap gap-2">
              {mediaTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-full px-3 py-1 font-medium hover-scale ${
                    typeFilter === type ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground"
                  }`}
                >
                  {type === "all" ? "All types" : type.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "partner", "independent"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSchoolFilter(key)}
                  className={`rounded-full px-3 py-1 font-medium hover-scale ${
                    schoolFilter === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                  }`}
                >
                  {key === "all" ? "All schools" : key === "partner" ? "Partner schools" : "Independent"}
                </button>
              ))}
            </div>
            {cohorts.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {cohorts.map((cohort) => (
                  <button
                    key={cohort}
                    type="button"
                    onClick={() => setCohortFilter(cohort)}
                    className={`rounded-full px-3 py-1 font-medium hover-scale ${
                      cohortFilter === cohort ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                    }`}
                  >
                    {cohort === "all" ? "All cohorts" : cohort}
                  </button>
                ))}
              </div>
            )}
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

        {!isLoading && !isError && filtered.length > 0 && (
          <section className="grid gap-5 md:grid-cols-3">
            {filtered.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col rounded-3xl border border-primary/10 bg-card p-4 shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-secondary/90 px-2 py-1 font-semibold uppercase tracking-wide text-secondary-foreground">
                    {project.media_type.replace("_", " ")}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-[10px] text-primary">
                    {project.school_id ? "Partner school" : "Independent learner"}
                  </span>
                </div>
                <h2 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                  {project.title}
                </h2>
                {project.cohort && (
                  <p className="mt-1 text-[11px] font-medium text-primary/80">Cohort: {project.cohort}</p>
                )}
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

        <section className="mt-10 rounded-3xl border border-primary/15 bg-card p-5 text-sm text-muted-foreground">
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
              <Button
                asChild
                size="sm"
                className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
              >
                <Link to="/school">Partner as a School</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hover-scale border-primary/40 bg-background text-primary hover:bg-muted/60"
              >
                <Link to="/payments">Register a Child</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

