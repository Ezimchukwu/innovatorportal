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

type SchoolRow = Tables<"schools">;
type StudentRow = Tables<"students">;
type ProjectRow = Tables<"projects">;

interface SchoolDashboardData {
  school: SchoolRow | null;
  students: StudentRow[];
  projectsByStudent: Record<string, ProjectRow[]>;
}

const schoolProjectSchema = z.object({
  student_id: z.string().uuid({ message: "Select a student for this project" }),
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
  is_school_gallery: z.boolean().default(true),
});

const fetchSchoolDashboard = async (userId: string): Promise<SchoolDashboardData> => {
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (schoolError) throw schoolError;

  if (!school) {
    return { school: null, students: [], projectsByStudent: {} };
  }

  const [{ data: students, error: studentsError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("school_id", school.id)
      .order("full_name", { ascending: true }),
    supabase
      .from("projects")
      .select("*")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false }),
  ]);

  if (studentsError) throw studentsError;
  if (projectsError) throw projectsError;

  const projectsByStudent: Record<string, ProjectRow[]> = {};
  (projects ?? []).forEach((project) => {
    const key = project.student_id;
    if (!key) return;
    if (!projectsByStudent[key]) projectsByStudent[key] = [];
    projectsByStudent[key].push(project);
  });

  return {
    school,
    students: students ?? [],
    projectsByStudent,
  };
};

export const SchoolDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState<z.infer<typeof schoolProjectSchema>>({
    student_id: "",
    title: "",
    description: "",
    media_type: "web_app",
    visibility: "private",
    external_url: "",
    is_public_gallery: false,
    is_school_gallery: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof z.infer<typeof schoolProjectSchema>, string>>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["school-dashboard", user?.id],
    queryFn: () => fetchSchoolDashboard(user!.id),
    enabled: !!user?.id,
  });

  const school = data?.school ?? null;
  const students = data?.students ?? [];
  const projectsByStudent = data?.projectsByStudent ?? {};

  const handleChange = (field: keyof z.infer<typeof schoolProjectSchema>, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value } as any));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user) return;

    const parsed = schoolProjectSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof z.infer<typeof schoolProjectSchema>, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof z.infer<typeof schoolProjectSchema>;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
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
        student_id: clean.student_id,
        school_id: school.id,
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
        title: "Project recorded",
        description: "The project is now linked to this school. Admins can approve it for public visibility.",
      });

      setValues({
        student_id: "",
        title: "",
        description: "",
        media_type: "web_app",
        visibility: "private",
        external_url: "",
        is_public_gallery: false,
        is_school_gallery: true,
      });
      setErrors({});
      await queryClient.invalidateQueries({ queryKey: ["school-dashboard", user.id] });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="School Dashboard"
        description="Manage students and log AI projects for your school in a light, simple portal."
        canonical={`${window.location.origin}/school`}
      />
      <main className="container pb-12 pt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-xs"
          >
            ← Back
          </Button>
        </div>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">School Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Overview of your AI Innovators</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this space to connect student profiles, log projects and decide which work should appear in school or public
            galleries.
          </p>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading your school data...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            We couldn&apos;t load your school dashboard right now. Please refresh and try again.
            <div className="mt-1 text-[11px] text-destructive/80">{(error as Error).message}</div>
          </div>
        )}

        {!isLoading && !isError && !school && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">School profile not set up</p>
            <p className="mt-1 max-w-xl">
              We can&apos;t find a school linked to this account yet. Once your partnership is confirmed, a school owner profile
              will unlock this dashboard.
            </p>
          </div>
        )}

        {!isLoading && !isError && school && (
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{school.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.city || "Location not set"} · {students.length} registered student
                      {students.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateProject} className="mt-4 space-y-3 text-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                    Log a student project
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="student-select">Student</Label>
                      <Select
                        value={values.student_id}
                        onValueChange={(value) => handleChange("student_id", value)}
                        disabled={creating || students.length === 0}
                      >
                        <SelectTrigger id="student-select">
                          <SelectValue placeholder={students.length ? "Select student" : "No students yet"} />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.full_name} {student.class_level ? `· ${student.class_level}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.student_id && (
                        <p className="text-[11px] text-destructive">{errors.student_id}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="school-project-title">Project title</Label>
                      <Input
                        id="school-project-title"
                        value={values.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        disabled={creating}
                        placeholder="e.g. Climate Story Visualizer"
                      />
                      {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="school-media-type">Type</Label>
                      <Select
                        value={values.media_type}
                        onValueChange={(value) => handleChange("media_type", value)}
                        disabled={creating}
                      >
                        <SelectTrigger id="school-media-type">
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
                    <div className="space-y-1.5">
                      <Label htmlFor="school-external-url">Link to project (optional)</Label>
                      <Input
                        id="school-external-url"
                        value={values.external_url ?? ""}
                        onChange={(e) => handleChange("external_url", e.target.value)}
                        disabled={creating}
                        placeholder="https://..."
                      />
                      {errors.external_url && (
                        <p className="text-[11px] text-destructive">{errors.external_url}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="school-project-description">Short description (optional)</Label>
                    <Textarea
                      id="school-project-description"
                      value={values.description ?? ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                      disabled={creating}
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-[11px] text-destructive">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Visibility</Label>
                      <Select
                        value={values.visibility}
                        onValueChange={(value) => handleChange("visibility", value)}
                        disabled={creating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private (only dashboards)</SelectItem>
                          <SelectItem value="public">Public (eligible for gallery)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 text-[11px] text-muted-foreground">
                      <label className="flex items-start gap-2">
                        <Checkbox
                          checked={values.is_public_gallery}
                          onCheckedChange={(checked) =>
                            handleChange("is_public_gallery", Boolean(checked))
                          }
                          disabled={creating}
                        />
                        <span>
                          Request public gallery feature
                          <span className="block text-[10px] text-muted-foreground">
                            Projects still require admin approval before appearing publicly.
                          </span>
                        </span>
                      </label>
                      <label className="flex items-start gap-2">
                        <Checkbox
                          checked={values.is_school_gallery}
                          onCheckedChange={(checked) =>
                            handleChange("is_school_gallery", Boolean(checked))
                          }
                          disabled={creating}
                        />
                        <span>
                          Include in school gallery
                          <span className="block text-[10px] text-muted-foreground">
                            Visible to your team and participating families.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={creating || students.length === 0}>
                      {creating ? "Saving project..." : "Save project"}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                  Projects by student
                </p>
                {students.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-xs text-muted-foreground">
                    Once students are registered under this school, you&apos;ll see their linked projects here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => {
                      const studentProjects = projectsByStudent[student.id] ?? [];
                      return (
                        <div
                          key={student.id}
                          className="rounded-2xl border border-border/70 bg-card/90 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">{student.full_name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {student.class_level || "Class not set"} · {student.batch || "Batch not set"}
                              </p>
                            </div>
                            <span className="rounded-full bg-muted/70 px-2 py-1 text-[10px] text-muted-foreground">
                              {studentProjects.length} project{studentProjects.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          {studentProjects.length > 0 && (
                            <ul className="mt-2 space-y-1.5 text-[11px]">
                              {studentProjects.slice(0, 3).map((project) => (
                                <li
                                  key={project.id}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="max-w-[65%] truncate text-foreground">{project.title}</span>
                                  <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                                    {project.media_type.replace("_", " ")}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-4 text-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                  Data & gallery rules
                </p>
                <p className="mt-2 text-muted-foreground">
                  Only approved parents, students and school owners can see private dashboards. Public gallery content is
                  always opt-in and requires admin approval before it appears on the open internet.
                </p>
              </div>

              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-4 text-xs">
                <p className="font-medium text-foreground">Need changes to a project?</p>
                <p className="mt-1 text-muted-foreground">
                  If a student&apos;s project was logged incorrectly, you can update it in the backend or contact the program
                  admin for support. Audit logs and approvals help keep galleries trustworthy.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};
