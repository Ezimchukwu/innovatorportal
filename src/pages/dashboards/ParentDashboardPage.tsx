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
    .max(120, { message: "Class must be under 120 characters" })
    .optional()
    .or(z.literal("")),
  batch: z
    .string()
    .trim()
    .max(120, { message: "Batch must be under 120 characters" })
    .optional()
    .or(z.literal("")),
  date_of_birth: z
    .string()
    .trim()
    .max(10, { message: "Use format YYYY-MM-DD" })
    .optional()
    .or(z.literal("")),
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

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Parent Dashboard"
        description="Track your child’s AI learning progress, projects and certificates securely."
        canonical={`${window.location.origin}/parent`}
      />
      <main className="container pb-12 pt-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Parent View</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your child’s AI journey</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No linked students yet</p>
            <p className="mt-1 max-w-xl">
              We can&apos;t find any student profiles connected to this parent account yet.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              If your child is not part of a partner school, you can set up their profile yourself.
            </p>
          </div>
        )}

        {!isLoading && !isError && parent && students.length > 0 && (
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              {students.map((student) => {
                const studentProjects = data!.projectsByStudent[student.id] ?? [];
                const studentAssignments = data!.assignmentsByStudent[student.id] ?? [];

                const completedAssignments = studentAssignments.filter((a) => a.status === "submitted");

                return (
                  <div
                    key={student.id}
                    className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm"
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
                <Button className="mt-3 w-full" variant="subtle" size="sm" disabled>
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
