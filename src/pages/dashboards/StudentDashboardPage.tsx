import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type StudentRow = Tables<"students">;
type ProjectRow = Tables<"projects">;
type AssignmentRow = Tables<"assignments">;

interface StudentDashboardData {
  student: StudentRow | null;
  projects: ProjectRow[];
  assignments: AssignmentRow[];
}

const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(120, { message: "Title must be under 120 characters" }),
  description: z
    .string()
    .trim()
    .max(1000, { message: "Description must be under 1000 characters" })
    .optional()
    .or(z.literal("")),
  media_type: z.enum([
    "web_app",
    "chatbot",
    "design",
    "image",
    "video",
    "audio",
    "other",
  ]),
  visibility: z.enum(["public", "private"]).default("private"),
  external_url: z
    .string()
    .trim()
    .url({ message: "Enter a valid URL (including https://)" })
    .max(500, { message: "Link is too long" })
    .optional()
    .or(z.literal("")),
  is_public_gallery: z.boolean().default(false),
  is_school_gallery: z.boolean().default(false),
});

const fetchStudentDashboard = async (userId: string): Promise<StudentDashboardData> => {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (studentError) throw studentError;

  if (!student) {
    return { student: null, projects: [], assignments: [] };
  }

  const [{ data: projects, error: projectsError }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assignments")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false }),
    ]);

  if (projectsError) throw projectsError;
  if (assignmentsError) throw assignmentsError;

  return {
    student,
    projects: projects ?? [],
    assignments: assignments ?? [],
  };
};

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [projectValues, setProjectValues] = useState<z.infer<typeof projectSchema>>({
    title: "",
    description: "",
    media_type: "web_app",
    visibility: "private",
    external_url: "",
    is_public_gallery: false,
    is_school_gallery: true,
  });
  const [projectErrors, setProjectErrors] = useState<Partial<Record<keyof z.infer<typeof projectSchema>, string>>>(
    {},
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["student-dashboard", user?.id],
    queryFn: () => fetchStudentDashboard(user!.id),
    enabled: !!user?.id,
  });

  const student = data?.student ?? null;
  const projects = data?.projects ?? [];
  const assignments = data?.assignments ?? [];

  const handleProjectChange = (field: keyof z.infer<typeof projectSchema>, value: unknown) => {
    setProjectValues((prev) => ({ ...prev, [field]: value } as any));
    setProjectErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !user) return;

    const parsed = projectSchema.safeParse(projectValues);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof z.infer<typeof projectSchema>, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof z.infer<typeof projectSchema>;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setProjectErrors(fieldErrors);
      return;
    }

    setCreating(true);
    try {
      const clean = parsed.data;
      const { error: insertError } = await supabase.from("projects").insert({
        title: clean.title,
        description: clean.description || null,
        media_type: clean.media_type,
        visibility: clean.visibility,
        external_url: clean.external_url || null,
        is_public_gallery: clean.is_public_gallery,
        is_school_gallery: clean.is_school_gallery,
        student_id: student.id,
        school_id: student.school_id,
      });

      if (insertError) {
        toast({
          title: "Could not create project",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Project saved",
        description: "Your AI project has been recorded. Admins can now review it for the public gallery.",
      });

      setProjectValues({
        title: "",
        description: "",
        media_type: "web_app",
        visibility: "private",
        external_url: "",
        is_public_gallery: false,
        is_school_gallery: true,
      });
      setProjectErrors({});
      await queryClient.invalidateQueries({ queryKey: ["student-dashboard", user.id] });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Student Dashboard"
        description="View and create AI projects, track assignments and follow your AI learning journey."
        canonical={`${window.location.origin}/student`}
      />
      <main className="container pb-24 pt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
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

        <header className="mb-5 animate-fade-in">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Student Space</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">Your AI projects and assignments</h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            This dashboard shows only data linked to your student profile. New projects you create here can be submitted for
            school or public galleries.
          </p>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading your dashboard...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            We couldn&apos;t load your dashboard right now. Please refresh and try again.
            <div className="mt-1 text-[11px] text-destructive/80">{(error as Error).message}</div>
          </div>
        )}

        {!isLoading && !isError && !student && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Student profile not set up yet</p>
            <p className="mt-1 max-w-xl">
              Your login is working, but we can&apos;t find a student record linked to this account. Please contact your school or
              the AI Innovators team to complete your registration.
            </p>
          </div>
        )}

        {!isLoading && !isError && student && (
          <section className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4 animate-enter">
              <div className="rounded-3xl border border-primary/10 bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.class_level || "Class not set"} · {student.batch || "Batch not set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-muted/70 px-2 py-1">
                      {projects.length} project{projects.length === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-muted/70 px-2 py-1">
                      {assignments.filter((a) => a.status === "submitted").length}/{assignments.length} assignments submitted
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCreateProject} className="mt-4 space-y-3 text-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                    Log a new AI project
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="project-title">Project title</Label>
                      <Input
                        id="project-title"
                        value={projectValues.title}
                        onChange={(e) => handleProjectChange("title", e.target.value)}
                        disabled={creating}
                        placeholder="e.g. Chatbot for school fees FAQs"
                      />
                      {projectErrors.title && <p className="text-[11px] text-destructive">{projectErrors.title}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="media-type">Type</Label>
                      <Select
                        value={projectValues.media_type}
                        onValueChange={(value) => handleProjectChange("media_type", value)}
                        disabled={creating}
                      >
                        <SelectTrigger id="media-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web_app">Web app</SelectItem>
                          <SelectItem value="chatbot">Chatbot</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="project-description">Short description (optional)</Label>
                    <Textarea
                      id="project-description"
                      value={projectValues.description ?? ""}
                      onChange={(e) => handleProjectChange("description", e.target.value)}
                      disabled={creating}
                      rows={3}
                    />
                    {projectErrors.description && (
                      <p className="text-[11px] text-destructive">{projectErrors.description}</p>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="external-url">Link to project (optional)</Label>
                      <Input
                        id="external-url"
                        value={projectValues.external_url ?? ""}
                        onChange={(e) => handleProjectChange("external_url", e.target.value)}
                        disabled={creating}
                        placeholder="https://..."
                      />
                      {projectErrors.external_url && (
                        <p className="text-[11px] text-destructive">{projectErrors.external_url}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Visibility</Label>
                      <Select
                        value={projectValues.visibility}
                        onValueChange={(value) => handleProjectChange("visibility", value)}
                        disabled={creating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private (only dashboard)</SelectItem>
                          <SelectItem value="public">Public (eligible for gallery)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2 text-[11px] text-muted-foreground md:grid-cols-2">
                    <label className="flex items-start gap-2">
                      <Checkbox
                        checked={projectValues.is_public_gallery}
                        onCheckedChange={(checked) =>
                          handleProjectChange("is_public_gallery", Boolean(checked))
                        }
                        disabled={creating}
                      />
                      <span>
                        Request public gallery feature
                        <span className="block text-[10px] text-muted-foreground">
                          Admins must approve before it appears on the public gallery.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2">
                      <Checkbox
                        checked={projectValues.is_school_gallery}
                        onCheckedChange={(checked) =>
                          handleProjectChange("is_school_gallery", Boolean(checked))
                        }
                        disabled={creating}
                      />
                      <span>
                        Show in my school gallery
                        <span className="block text-[10px] text-muted-foreground">
                          Visible to your school team once reviewed.
                        </span>
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={creating}
                      className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
                    >
                      {creating ? "Saving project..." : "Save project"}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                  Your recent projects
                </p>
                {projects.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-xs text-muted-foreground">
                    Once you log your first project, it will appear here with its gallery status and type.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {projects.map((project) => (
                      <li
                        key={project.id}
                        className="flex flex-col gap-2 rounded-2xl border border-primary/5 bg-card p-3 text-xs shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{project.title}</p>
                            {project.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <span className="rounded-full bg-muted/80 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                            {project.media_type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="rounded-full bg-muted/60 px-2 py-1">
                            {project.visibility === "public" ? "Public" : "Private"}
                          </span>
                          {project.is_public_gallery && (
                            <span className="rounded-full bg-muted/60 px-2 py-1">
                              Public gallery request • {project.approved_by_admin ? "Approved" : "Pending"}
                            </span>
                          )}
                          {project.is_school_gallery && (
                            <span className="rounded-full bg-muted/60 px-2 py-1">School gallery</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                  Assignments overview
                </p>
                {assignments.length === 0 ? (
                  <p className="mt-2 text-xs">
                    When your instructor assigns work, it will appear here so you can track status and feedback.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-[11px]">
                    {assignments.slice(0, 5).map((assignment) => (
                      <li key={assignment.id} className="flex items-center justify-between">
                        <span className="max-w-[60%] truncate text-foreground">{assignment.title}</span>
                        <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          {assignment.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-4 text-xs">
                <p className="font-medium text-foreground">How your data is used</p>
                <p className="mt-1 text-muted-foreground">
                  Only your school and approved parents can see private dashboards. Public gallery projects must be explicitly
                  requested and approved before they are visible on the internet.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};
