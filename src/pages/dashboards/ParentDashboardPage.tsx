import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

type ParentRow = Tables<"parents">;
type StudentRow = Tables<"students">;
type ProjectRow = Tables<"projects">;
type AssignmentRow = Tables<"assignments">;

type DashboardData = {
  parent: ParentRow | null;
  students: StudentRow[];
  projectsByStudent: Record<string, ProjectRow[]>;
  assignmentsByStudent: Record<string, AssignmentRow[]>;
};

const childSetupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(120, { message: "Name must be under 120 characters" }),
  class_level: z
    .string()
    .trim()
    .min(1, { message: "Class level is required" })
    .max(120, { message: "Class must be under 120 characters" }),
  age: z
    .coerce.number({ invalid_type_error: "Age must be a number" })
    .int({ message: "Age must be a whole number" })
    .min(5, { message: "Age must be at least 5" })
    .max(25, { message: "Age must be 25 or younger" }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Select a gender",
    invalid_type_error: "Select a gender",
  }),
});


const fetchParentDashboard = async (userId: string): Promise<DashboardData> => {
  // 1) Parent profile
  const { data: parent, error: parentError } = await supabase
    .from("parents")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (parentError) throw parentError;

  if (!parent) {
    return { parent: null, students: [], projectsByStudent: {}, assignmentsByStudent: {} };
  }

  // 2) Linked students via parent_students
  const { data: links, error: linksError } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parent.id);

  if (linksError) throw linksError;

  const studentIds = (links ?? []).map((l) => l.student_id).filter(Boolean) as string[];

  if (studentIds.length === 0) {
    return { parent, students: [], projectsByStudent: {}, assignmentsByStudent: {} };
  }

  // 3) Student records
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .in("id", studentIds);

  if (studentsError) throw studentsError;

  // 4) Projects for all linked students (RLS ensures only allowed rows)
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  if (projectsError) throw projectsError;

  // 5) Assignments for all linked students
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("*")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  if (assignmentsError) throw assignmentsError;

  const projectsByStudent: Record<string, ProjectRow[]> = {};
  (projects ?? []).forEach((p) => {
    const key = p.student_id;
    if (!key) return;
    if (!projectsByStudent[key]) projectsByStudent[key] = [];
    projectsByStudent[key].push(p);
  });

  const assignmentsByStudent: Record<string, AssignmentRow[]> = {};
  (assignments ?? []).forEach((a) => {
    const key = a.student_id;
    if (!key) return;
    if (!assignmentsByStudent[key]) assignmentsByStudent[key] = [];
    assignmentsByStudent[key].push(a);
  });

  return { parent, students: students ?? [], projectsByStudent, assignmentsByStudent };
};

export const ParentDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [creatingChild, setCreatingChild] = useState(false);
  const [childValues, setChildValues] = useState<z.infer<typeof childSetupSchema>>({
    full_name: "",
    class_level: "",
    age: 10,
    gender: "male",
  });
  const [childErrors, setChildErrors] = useState<
    Partial<Record<keyof z.infer<typeof childSetupSchema>, string>>
  >({});

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["parent-dashboard", user?.id],
    queryFn: () => fetchParentDashboard(user!.id),
    enabled: !!user?.id,
  });

  const parent = data?.parent ?? null;
  const students = data?.students ?? [];

  const handleChildChange = (
    field: keyof z.infer<typeof childSetupSchema>,
    value: unknown,
  ) => {
    setChildValues((prev) => ({ ...prev, [field]: value } as any));
    setChildErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = childSetupSchema.safeParse(childValues);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof z.infer<typeof childSetupSchema>, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof z.infer<typeof childSetupSchema>;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setChildErrors(fieldErrors);
      return;
    }

    setCreatingChild(true);
    try {
      // Ensure parent profile exists
      let currentParent = parent;
      if (!currentParent) {
        const { data: createdParent, error: parentInsertError } = await supabase
          .from("parents")
          .insert({
            user_id: user.id,
            full_name: user.email ?? "Parent",
          })
          .select("*")
          .maybeSingle();

        if (parentInsertError) {
          toast({
            title: "Could not create parent profile",
            description: parentInsertError.message,
            variant: "destructive",
          });
          return;
        }

        currentParent = createdParent ?? null;
      }

      if (!currentParent) {
        toast({
          title: "Parent profile missing",
          description: "We couldn\'t link this child to your account.",
          variant: "destructive",
        });
        return;
      }

      const clean = parsed.data;

      const { data: createdStudent, error: studentError } = await supabase
        .from("students")
        .insert({
          full_name: clean.full_name,
          class_level: clean.class_level,
          age: clean.age,
          gender: clean.gender,
          school_id: null,
        })
        .select("id")
        .maybeSingle();

      if (studentError || !createdStudent) {
        toast({
          title: "Could not create student",
          description: studentError?.message ?? "Student could not be created.",
          variant: "destructive",
        });
        return;
      }

      const { error: linkError } = await supabase.from("parent_students").insert({
        parent_id: currentParent.id,
        student_id: createdStudent.id,
      });

      if (linkError) {
        toast({
          title: "Could not link child",
          description: linkError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Child added",
        description: "We\'ve linked this child to your parent dashboard.",
      });

      setChildValues({
        full_name: "",
        class_level: "",
        age: 10,
        gender: "male",
      });
      setChildErrors({});
      await queryClient.invalidateQueries({ queryKey: ["parent-dashboard", user.id] });
    } finally {
      setCreatingChild(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Parent Dashboard"
        description="Track your child’s AI learning progress, projects and certificates securely."
        canonical={`${window.location.origin}/parent`}
      />
      <main className="container pb-24 pt-10">
        <header className="mb-5 animate-fade-in">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Parent View</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">Your child’s AI journey</h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            You&apos;ll only ever see information linked to your approved child profile. Public projects remain visible to
            everyone, but this space is private to you.
          </p>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading your family dashboard...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            We couldn&apos;t load your dashboard right now. Please refresh and try again.
            <div className="mt-1 text-[11px] text-destructive/80">{(error as Error).message}</div>
          </div>
        )}

        {!isLoading && !isError && !parent && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Parent profile not set up yet</p>
            <p className="mt-1 max-w-xl">
              Your login is working, but an admin hasn&apos;t linked this account to a child profile yet. Once that is done,
              you&apos;ll see your child&apos;s projects, assignments and certificates here.
            </p>
          </div>
        )}

        {!isLoading && !isError && parent && students.length === 0 && (
          <section className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No linked students yet</p>
            <p className="mt-1 max-w-xl">
              We can&apos;t find any student profiles connected to this parent account yet.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              If your child is not part of a partner school, you can set up their profile here so you can track their
              projects and assignments.
            </p>

            <form onSubmit={handleCreateChild} className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="child-full-name">Child&apos;s full name</Label>
                <Input
                  id="child-full-name"
                  value={childValues.full_name}
                  onChange={(e) => handleChildChange("full_name", e.target.value)}
                  disabled={creatingChild}
                  placeholder="e.g. Ada Lovelace"
                />
                {childErrors.full_name && (
                  <p className="text-[11px] text-destructive">{childErrors.full_name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="child-class-level">Class level</Label>
                <Input
                  id="child-class-level"
                  value={childValues.class_level}
                  onChange={(e) => handleChildChange("class_level", e.target.value)}
                  disabled={creatingChild}
                  placeholder="e.g. JSS 2" 
                />
                {childErrors.class_level && (
                  <p className="text-[11px] text-destructive">{childErrors.class_level}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="child-age">Age</Label>
                <Input
                  id="child-age"
                  type="number"
                  min={5}
                  max={25}
                  value={childValues.age}
                  onChange={(e) => handleChildChange("age", e.target.value)}
                  disabled={creatingChild}
                />
                {childErrors.age && <p className="text-[11px] text-destructive">{childErrors.age}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="child-gender">Gender</Label>
                <select
                  id="child-gender"
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={childValues.gender}
                  onChange={(e) => handleChildChange("gender", e.target.value)}
                  disabled={creatingChild}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say / Other</option>
                </select>
                {childErrors.gender && (
                  <p className="text-[11px] text-destructive">{childErrors.gender}</p>
                )}
              </div>

              <div className="md:col-span-2 mt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={creatingChild}
                  className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
                >
                  {creatingChild ? "Saving child..." : "Save child profile"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {!isLoading && !isError && parent && students.length > 0 && (
          <section className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4 animate-enter">
              {students.map((student) => {
                const studentProjects = data!.projectsByStudent[student.id] ?? [];
                const studentAssignments = data!.assignmentsByStudent[student.id] ?? [];

                const completedAssignments = studentAssignments.filter((a) => a.status === "submitted");

                return (
                  <div
                    key={student.id}
                    className="rounded-3xl border border-primary/10 bg-card p-5 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.class_level || "Class not set"} · {student.batch || "Batch not set"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-muted/70 px-2 py-1">
                          {studentProjects.length} project{studentProjects.length === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-muted/70 px-2 py-1">
                          {completedAssignments.length}/{studentAssignments.length} assignments submitted
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-xs">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                          Recent projects
                        </p>
                        {studentProjects.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No projects have been uploaded yet. Once your child&apos;s work is approved, it will appear here.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {studentProjects.slice(0, 3).map((project) => (
                              <li
                                key={project.id}
                                className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2"
                              >
                                <div>
                                  <p className="text-xs font-medium text-foreground">{project.title}</p>
                                  {project.description && (
                                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                                      {project.description}
                                    </p>
                                  )}
                                </div>
                                <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                                  {project.media_type.replace("_", " ")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                          Assignments & feedback
                        </p>
                        {studentAssignments.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            We don&apos;t see any assignments yet. When an instructor assigns work, you&apos;ll be able to track it
                            here.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-1.5">
                            {studentAssignments.slice(0, 3).map((assignment) => (
                              <li key={assignment.id} className="flex items-center justify-between text-[11px]">
                                <span className="max-w-[60%] truncate text-foreground">{assignment.title}</span>
                                <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                  {assignment.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                  Certificate status
                </p>
                <p className="mt-2 text-sm">
                  Certificates will be available once your child completes the required projects and the cohort is marked as
                  finished by the program admin.
                </p>
                <Button
                  className="mt-3 w-full hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
                  variant="subtle"
                  size="sm"
                  disabled
                >
                  Download certificate (coming soon)
                </Button>
              </div>

              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-4 text-xs">
                <p className="font-medium text-foreground">How your data is protected</p>
                <p className="mt-1">
                  This dashboard only shows information connected to this parent login. You cannot view other students&apos;
                  data, and public visitors only see a separate gallery of selected projects.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};
