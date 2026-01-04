import { Seo } from "@/components/Seo";
import { MainNavbar } from "@/components/MainNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

type ApprovalRow = Tables<"approvals">;
type UserRoleRow = Tables<"user_roles">;
type PaymentRow = Tables<"payments">;
type ProjectRow = Tables<"projects">;
type AnnouncementRow = Tables<"announcements">;
type StudentRow = Tables<"students">;
type ParentRow = Tables<"parents">;
type SchoolRow = Tables<"schools">;

type AnnouncementTarget = Enums<"announcement_target">;

interface OverviewCounts {
  totalStudents: number;
  totalParents: number;
  totalSchools: number;
  totalProjects: number;
  publicGalleryProjects: number;
  pendingApprovals: number;
  totalPayments: number;
  verifiedPayments: number;
  totalAnnouncements: number;
}

interface AdminDashboardData {
  counts: OverviewCounts;
  pendingApprovals: ApprovalRow[];
  recentPayments: PaymentRow[];
  recentProjects: ProjectRow[];
  recentAnnouncements: AnnouncementRow[];
  profileSummary: {
    students: StudentRow[];
    parents: ParentRow[];
    schools: SchoolRow[];
  };
}

const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, { message: "Title must be at least 4 characters" })
    .max(160, { message: "Title must be under 160 characters" }),
  body: z
    .string()
    .trim()
    .min(10, { message: "Body should give a bit more context" })
    .max(2000, { message: "Body must be under 2000 characters" }),
  target: z.custom<AnnouncementTarget>().default("all" as AnnouncementTarget),
});

const fetchAdminDashboard = async (): Promise<AdminDashboardData> => {
  const [
    studentsCountRes,
    parentsCountRes,
    schoolsCountRes,
    projectsCountRes,
    publicGalleryCountRes,
    pendingApprovalsCountRes,
    paymentsCountRes,
    verifiedPaymentsCountRes,
    announcementsCountRes,
    pendingApprovalsRes,
    recentPaymentsRes,
    recentProjectsRes,
    recentAnnouncementsRes,
    studentsSampleRes,
    parentsSampleRes,
    schoolsSampleRes,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("parents").select("id", { count: "exact", head: true }),
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("visibility", "public")
      .eq("approved_by_admin", true)
      .eq("is_public_gallery", true),
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("payments").select("id", { count: "exact", head: true }),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "verified"),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase
      .from("approvals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("parents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const anyError =
    studentsCountRes.error ||
    parentsCountRes.error ||
    schoolsCountRes.error ||
    projectsCountRes.error ||
    publicGalleryCountRes.error ||
    pendingApprovalsCountRes.error ||
    paymentsCountRes.error ||
    verifiedPaymentsCountRes.error ||
    announcementsCountRes.error ||
    pendingApprovalsRes.error ||
    recentPaymentsRes.error ||
    recentProjectsRes.error ||
    recentAnnouncementsRes.error ||
    studentsSampleRes.error ||
    parentsSampleRes.error ||
    schoolsSampleRes.error;

  if (anyError) {
    throw anyError;
  }

  const counts: OverviewCounts = {
    totalStudents: studentsCountRes.count ?? 0,
    totalParents: parentsCountRes.count ?? 0,
    totalSchools: schoolsCountRes.count ?? 0,
    totalProjects: projectsCountRes.count ?? 0,
    publicGalleryProjects: publicGalleryCountRes.count ?? 0,
    pendingApprovals: pendingApprovalsCountRes.count ?? 0,
    totalPayments: paymentsCountRes.count ?? 0,
    verifiedPayments: verifiedPaymentsCountRes.count ?? 0,
    totalAnnouncements: announcementsCountRes.count ?? 0,
  };

  return {
    counts,
    pendingApprovals: pendingApprovalsRes.data ?? [],
    recentPayments: recentPaymentsRes.data ?? [],
    recentProjects: recentProjectsRes.data ?? [],
    recentAnnouncements: recentAnnouncementsRes.data ?? [],
    profileSummary: {
      students: studentsSampleRes.data ?? [],
      parents: parentsSampleRes.data ?? [],
      schools: schoolsSampleRes.data ?? [],
    },
  };
};

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [announcementValues, setAnnouncementValues] = useState<z.infer<typeof announcementSchema>>({
    title: "",
    body: "",
    target: "all" as AnnouncementTarget,
  });
  const [announcementErrors, setAnnouncementErrors] = useState<
    Partial<Record<keyof z.infer<typeof announcementSchema>, string>>
  >({});
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  const counts = data?.counts;

  const handleAnnouncementChange = (field: keyof z.infer<typeof announcementSchema>, value: unknown) => {
    setAnnouncementValues((prev) => ({ ...prev, [field]: value } as any));
    setAnnouncementErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = announcementSchema.safeParse(announcementValues);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof z.infer<typeof announcementSchema>, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof z.infer<typeof announcementSchema>;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setAnnouncementErrors(fieldErrors);
      return;
    }

    setCreatingAnnouncement(true);
    try {
      const clean = parsed.data;
      const { error: insertError } = await supabase.from("announcements").insert({
        title: clean.title,
        body: clean.body,
        target: clean.target,
        created_by: user.id,
      });

      if (insertError) {
        toast({
          title: "Could not post announcement",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Announcement published",
        description: "Learners and families will see this the next time they refresh.",
      });

      setAnnouncementValues({ title: "", body: "", target: "all" as AnnouncementTarget });
      setAnnouncementErrors({});
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleDecisionOnApproval = async (approval: ApprovalRow, decision: "approved" | "rejected") => {
    if (!user) return;

    setProcessingApprovalId(approval.id);
    try {
      const { error: updateError } = await supabase
        .from("approvals")
        .update({
          status: decision,
          decided_at: new Date().toISOString(),
          decided_by: user.id,
        })
        .eq("id", approval.id);

      if (updateError) {
        toast({
          title: "Could not update approval",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      if (decision === "approved") {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", approval.user_id)
          .eq("role", approval.role)
          .maybeSingle();

        if (!existingRole) {
          const { error: insertRoleError } = await supabase.from("user_roles").insert({
            user_id: approval.user_id,
            role: approval.role,
          });

          if (insertRoleError) {
            toast({
              title: "Role could not be added, but approval was saved",
              description: insertRoleError.message,
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: `Request ${decision === "approved" ? "approved" : "rejected"}`,
        description: "The requester will see their updated access once they sign in again.",
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } finally {
      setProcessingApprovalId(null);
    }
  };

  const handleUpdatePaymentStatus = async (payment: PaymentRow, status: PaymentRow["status"]) => {
    setProcessingPaymentId(payment.id);
    try {
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", payment.id);

      if (updateError) {
        toast({
          title: "Could not update payment",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Payment updated",
        description: `Payment marked as ${status}.`,
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    return d.toLocaleString();
  };

  const formatAmount = (value: number | null | undefined) => {
    if (value == null) return "—";
    return value.toLocaleString();
  };

  const targets = Constants.public.Enums.announcement_target as readonly AnnouncementTarget[];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Admin Control Centre"
        description="Super admin overview for approvals, roles, payments, projects and broadcast announcements."
        canonical={`${window.location.origin}/admin`}
      />
      <MainNavbar />
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
          {user && (
            <span className="text-[11px] text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email ?? user.id}</span>
            </span>
          )}
        </div>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Super Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Control centre</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A single view of who has access, which profiles exist, which projects are live, and how enrollment payments are
            flowing through the portal.
          </p>
        </header>

        {isLoading && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-3xl bg-muted" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-3xl bg-muted" />
          </div>
        )}

        {isError && (
          <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            We couldn&apos;t load the admin dashboard.
            <div className="mt-1 text-[11px] text-destructive/80">{(error as Error).message}</div>
          </div>
        )}

        {!isLoading && !isError && counts && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-4">
              <Card className="rounded-3xl border-primary/15 bg-card shadow-[var(--shadow-soft)]">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
                    Learners
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between p-4 pt-0 text-sm">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{counts.totalStudents}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Student profiles</p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <p>{counts.totalParents} parents</p>
                    <p>{counts.totalSchools} schools</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary/15 bg-card shadow-[var(--shadow-soft)]">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between p-4 pt-0 text-sm">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{counts.totalProjects}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Total recorded</p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <p>{counts.publicGalleryProjects} in public gallery</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary/15 bg-card shadow-[var(--shadow-soft)]">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
                    Access requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between p-4 pt-0 text-sm">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{counts.pendingApprovals}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Awaiting decision</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">
                    Roles &amp; approvals
                  </Badge>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary/15 bg-card shadow-[var(--shadow-soft)]">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
                    Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between p-4 pt-0 text-sm">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{counts.totalPayments}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Payment records</p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <p>{counts.verifiedPayments} verified</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Tabs defaultValue="approvals" className="space-y-4">
              <TabsList className="rounded-full bg-muted/70 p-1 text-[11px]">
                <TabsTrigger value="approvals">Approvals &amp; roles</TabsTrigger>
                <TabsTrigger value="profiles">Profiles &amp; linking</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
              </TabsList>

              <TabsContent value="approvals" className="mt-4">
                <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
                    <div>
                      <CardTitle className="text-sm font-semibold tracking-tight">Pending approvals</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Decide which parents, schools and admins should have access. Decisions automatically update the
                        roles table.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {counts.pendingApprovals} open
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data?.pendingApprovals.length ? (
                      <ScrollArea className="max-h-[420px]">
                        <Table className="min-w-full text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Requested role</TableHead>
                              <TableHead>User ID</TableHead>
                              <TableHead>Created at</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.pendingApprovals.map((approval) => (
                              <TableRow key={approval.id}>
                                <TableCell className="font-medium">
                                  <Badge variant="secondary" className="uppercase tracking-[0.16em]">
                                    {approval.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-[11px]">{approval.user_id}</TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  {formatDate(approval.created_at)}
                                </TableCell>
                                <TableCell className="max-w-xs text-[11px] text-muted-foreground">
                                  {approval.reason || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={processingApprovalId === approval.id}
                                      onClick={() => void handleDecisionOnApproval(approval, "rejected")}
                                      className="h-7 px-2 text-[11px]"
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={processingApprovalId === approval.id}
                                      onClick={() => void handleDecisionOnApproval(approval, "approved")}
                                      className="h-7 px-3 text-[11px]"
                                    >
                                      {processingApprovalId === approval.id ? "Saving..." : "Approve & role"}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="p-6 text-xs text-muted-foreground">
                        No pending approvals right now. New access requests will appear here automatically.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profiles" className="mt-4">
                <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className="text-sm font-semibold tracking-tight">Profiles &amp; linking</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      High-level overview of learners, parents and school accounts to help you confirm that profiles are
                      being linked correctly during onboarding.
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-4 pt-0 md:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                        Recent students
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {data?.profileSummary.students.map((student) => (
                          <li key={student.id} className="flex items-center justify-between gap-2">
                            <span className="truncate text-foreground">{student.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {student.class_level || "Class ?"}
                            </span>
                          </li>
                        )) || <li className="text-muted-foreground">No students yet.</li>}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                        Recent parents
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {data?.profileSummary.parents.map((parent) => (
                          <li key={parent.id} className="flex items-center justify-between gap-2">
                            <span className="truncate text-foreground">{parent.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {parent.email || "Email ?"}
                            </span>
                          </li>
                        )) || <li className="text-muted-foreground">No parents yet.</li>}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                        Recent schools
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {data?.profileSummary.schools.map((school) => (
                          <li key={school.id} className="flex items-center justify-between gap-2">
                            <span className="truncate text-foreground">{school.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {school.city || school.country || "Location ?"}
                            </span>
                          </li>
                        )) || <li className="text-muted-foreground">No schools yet.</li>}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="mt-4">
                <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className="text-sm font-semibold tracking-tight">Recent projects</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Spot-check what learners and schools are recording, and confirm which projects are in the public
                      gallery pipeline.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data?.recentProjects.length ? (
                      <ScrollArea className="max-h-[420px]">
                        <Table className="min-w-full text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Visibility</TableHead>
                              <TableHead>Gallery flags</TableHead>
                              <TableHead>Approved</TableHead>
                              <TableHead>Created at</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.recentProjects.map((project) => (
                              <TableRow key={project.id}>
                                <TableCell className="font-medium text-foreground">{project.title}</TableCell>
                                <TableCell className="text-[11px] capitalize text-muted-foreground">
                                  {project.visibility}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  {project.is_public_gallery ? "Public" : "—"}/{" "}
                                  {project.is_school_gallery ? "School" : "—"}
                                </TableCell>
                                <TableCell className="text-[11px]">
                                  {project.approved_by_admin ? (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Approved
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">Pending</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  {formatDate(project.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="p-6 text-xs text-muted-foreground">No projects have been logged yet.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className="text-sm font-semibold tracking-tight">Recent payments</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Verify that enrollment payments were recorded correctly. Status updates here are purely internal
                      and don&apos;t call Paystack again.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data?.recentPayments.length ? (
                      <ScrollArea className="max-h-[420px]">
                        <Table className="min-w-full text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>User ID</TableHead>
                              <TableHead>Provider ref</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead className="text-right">Mark as</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.recentPayments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                  {payment.currency} {formatAmount(payment.amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      payment.status === "verified"
                                        ? "secondary"
                                        : payment.status === "failed"
                                          ? "destructive"
                                          : "outline"
                                    }
                                    className="uppercase tracking-[0.18em] text-[10px]"
                                  >
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-[11px]">
                                  {payment.user_id || "—"}
                                </TableCell>
                                <TableCell className="font-mono text-[10px]">
                                  {payment.provider_reference || "—"}
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  {formatDate(payment.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={processingPaymentId === payment.id}
                                      onClick={() => void handleUpdatePaymentStatus(payment, "failed")}
                                      className="h-7 px-2 text-[11px]"
                                    >
                                      Mark failed
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={processingPaymentId === payment.id}
                                      onClick={() => void handleUpdatePaymentStatus(payment, "verified")}
                                      className="h-7 px-3 text-[11px]"
                                    >
                                      Mark verified
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="p-6 text-xs text-muted-foreground">No payments have been recorded yet.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="announcements" className="mt-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
                  <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="text-sm font-semibold tracking-tight">New announcement</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Broadcast a short message to all learners, only students, parents or schools. These can be
                        surfaced in dashboards or sent via email later on.
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
                        <div className="space-y-1.5">
                          <label htmlFor="announcement-title" className="text-[11px] font-medium text-foreground">
                            Title
                          </label>
                          <Input
                            id="announcement-title"
                            value={announcementValues.title}
                            onChange={(e) => handleAnnouncementChange("title", e.target.value)}
                            disabled={creatingAnnouncement}
                            placeholder="e.g. Mid-term showcase dates"
                          />
                          {announcementErrors.title && (
                            <p className="text-[11px] text-destructive">{announcementErrors.title}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="announcement-body" className="text-[11px] font-medium text-foreground">
                            Message
                          </label>
                          <Textarea
                            id="announcement-body"
                            value={announcementValues.body}
                            onChange={(e) => handleAnnouncementChange("body", e.target.value)}
                            disabled={creatingAnnouncement}
                            rows={5}
                            placeholder="Keep it short, but clear. This could show on student and parent dashboards."
                          />
                          {announcementErrors.body && (
                            <p className="text-[11px] text-destructive">{announcementErrors.body}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-foreground">Audience</span>
                          <div className="flex flex-wrap gap-2">
                            {targets.map((target) => (
                              <button
                                key={target}
                                type="button"
                                onClick={() => handleAnnouncementChange("target", target)}
                                className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                                  announcementValues.target === target
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {target === "all" ? "Everyone" : target.charAt(0).toUpperCase() + target.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm" className="text-[11px]">
                                Preview copy
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="text-sm">Announcement preview</DialogTitle>
                              </DialogHeader>
                              <div className="mt-2 space-y-2 text-sm">
                                <p className="text-xs text-muted-foreground">This is how a dashboard banner could look.</p>
                                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs">
                                  <p className="font-semibold text-foreground">{announcementValues.title || "Title"}</p>
                                  <p className="mt-1 text-muted-foreground">
                                    {announcementValues.body || "Short message about timelines, expectations or news."}
                                  </p>
                                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-primary">
                                    {announcementValues.target === "all"
                                      ? "Visible to everyone"
                                      : `Targeted at ${announcementValues.target}`}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={creatingAnnouncement}
                            className="text-[11px]"
                          >
                            {creatingAnnouncement ? "Publishing..." : "Publish announcement"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="text-sm font-semibold tracking-tight">Recent announcements</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        A quick list of what you&apos;ve broadcast recently. Future iterations can wire this up to email
                        and in-app banners.
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {data?.recentAnnouncements.length ? (
                        <ul className="space-y-3 text-xs">
                          {data.recentAnnouncements.map((item) => (
                            <li
                              key={item.id}
                              className="rounded-2xl border border-border/70 bg-muted/40 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-3">
                                    {item.body}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-[10px] uppercase tracking-[0.16em]">
                                  {item.target === "all"
                                    ? "Everyone"
                                    : item.target.charAt(0).toUpperCase() + item.target.slice(1)}
                                </Badge>
                              </div>
                              <p className="mt-2 text-[10px] text-muted-foreground">
                                {formatDate(item.created_at)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">No announcements posted yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};
