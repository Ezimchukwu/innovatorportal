import { Seo } from "@/components/Seo";
import { MainNavbar } from "@/components/MainNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

type ApprovalRow = Tables<"approvals">;
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

const createStudentSchema = z.object({
  user_id: z.string().trim().min(1, { message: "User ID is required" }),
  full_name: z.string().trim().min(2, { message: "Student name is required" }).max(120),
  class_level: z.string().trim().max(60).optional().or(z.literal("")),
  batch: z.string().trim().max(60).optional().or(z.literal("")),
  gender: z.string().trim().max(30).optional().or(z.literal("")),
  age: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v == null || (Number.isInteger(v) && v >= 2 && v <= 30), {
      message: "Age must be a whole number between 2 and 30",
    }),
  school_id: z.string().uuid().optional().or(z.literal("")),
});

const linkParentStudentSchema = z.object({
  parent_id: z.string().uuid({ message: "Pick a parent" }),
  student_id: z.string().uuid({ message: "Pick a student" }),
  relationship: z.string().trim().max(60).optional().or(z.literal("")),
});

const assignSchoolSchema = z.object({
  student_id: z.string().uuid({ message: "Pick a student" }),
  school_id: z.string().uuid().optional().or(z.literal("")),
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
      .limit(5),
    supabase
      .from("parents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
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
  const { roles } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isSuperAdmin = roles?.includes("admin") || roles?.includes("super_admin") ||
                        user?.email?.toLowerCase() === "divinetonyezimchukwu@gmail.com";

  // Debug logging for roles
  console.log("User roles:", roles);
  console.log("Is super admin:", isSuperAdmin);
  console.log("Current user:", { id: user?.id, email: user?.email });

  const [announcementValues, setAnnouncementValues] = useState<z.infer<typeof announcementSchema>>({
    title: "",
    body: "",
    target: "all" as AnnouncementTarget,
  });
  const [announcementErrors, setAnnouncementErrors] = useState<
    Partial<Record<keyof z.infer<typeof announcementSchema>, string>>
  >({});
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const [creatingStudent, setCreatingStudent] = useState(false);
  const [linkingParentStudent, setLinkingParentStudent] = useState(false);
  const [assigningSchool, setAssigningSchool] = useState(false);

  const [studentForm, setStudentForm] = useState<{
    user_id: string;
    full_name: string;
    class_level: string;
    batch: string;
    gender: string;
    age: string;
    school_id: string;
  }>({
    user_id: "",
    full_name: "",
    class_level: "",
    batch: "",
    gender: "",
    age: "",
    school_id: "",
  });
  const [studentFormError, setStudentFormError] = useState<string | null>(null);

  const [parentStudentForm, setParentStudentForm] = useState<{
    parent_id: string;
    student_id: string;
    relationship: string;
  }>({ parent_id: "", student_id: "", relationship: "" });
  const [parentStudentError, setParentStudentError] = useState<string | null>(null);

  const [assignSchoolForm, setAssignSchoolForm] = useState<{ student_id: string; school_id: string }>({
    student_id: "",
    school_id: "",
  });
  const [assignSchoolError, setAssignSchoolError] = useState<string | null>(null);

  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [processingProjectId, setProcessingProjectId] = useState<string | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectErrors, setProjectErrors] = useState<{
    title?: string;
    mediaType?: string;
  }>({});
  const [projectForm, setProjectForm] = useState<{
    title: string;
    description: string;
    mediaType: ProjectRow["media_type"];
    externalUrl: string;
    thumbnailUrl: string;
    thumbnailFile: File | null;
    studentId: string | "";
    isPublicGallery: boolean;
    isFeaturedHomepage: boolean;
    isPlatformShowcase: boolean;
  }>({
    title: "",
    description: "",
    mediaType: "web_app" as ProjectRow["media_type"],
    externalUrl: "",
    thumbnailUrl: "",
    thumbnailFile: null,
    studentId: "" as string | "",
    isPublicGallery: true,
    isFeaturedHomepage: true,
    isPlatformShowcase: false,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });

  const { data: allStudents } = useQuery({
    queryKey: ["admin-dashboard-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, school_id, batch, class_level")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as Pick<StudentRow, "id" | "full_name" | "school_id" | "batch" | "class_level">[];
    },
  });

  const { data: allParents } = useQuery({
    queryKey: ["admin-dashboard-parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parents")
        .select("id, full_name, email")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as Pick<ParentRow, "id" | "full_name" | "email">[];
    },
  });

  const { data: allSchools } = useQuery({
    queryKey: ["admin-dashboard-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, city, country")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as Pick<SchoolRow, "id" | "name" | "city" | "country">[];
    },
  });

  // Get available students for parent linking (students not already linked to the selected parent)
  const { data: availableStudentsForParent } = useQuery({
    queryKey: ["admin-dashboard-available-students", parentStudentForm.parent_id],
    queryFn: async () => {
      if (!parentStudentForm.parent_id) return [];

      // Get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, class_level, batch")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      // Get students already linked to this parent
      const { data: linkedStudents, error: linksError } = await supabase
        .from("parent_students")
        .select("student_id")
        .eq("parent_id", parentStudentForm.parent_id);

      if (linksError) throw linksError;

      const linkedStudentIds = new Set(linkedStudents?.map(link => link.student_id) || []);

      // Filter out already linked students
      return allStudents?.filter(student => !linkedStudentIds.has(student.id)) || [];
    },
    enabled: !!parentStudentForm.parent_id,
  });


  const studentOptions = useMemo(
    () =>
      (allStudents ?? []).map((s) => ({
        value: s.id,
        label: `${s.full_name}${s.class_level ? ` · ${s.class_level}` : ""}`,
        keywords: `${s.full_name} ${s.class_level ?? ""} ${s.batch ?? ""}`.trim(),
      })),
    [allStudents],
  );

  const availableStudentOptionsForParent = useMemo(
    () =>
      (availableStudentsForParent ?? []).map((s) => ({
        value: s.id,
        label: `${s.full_name}${s.class_level ? ` · ${s.class_level}` : ""}`,
        keywords: `${s.full_name} ${s.class_level ?? ""} ${s.batch ?? ""}`.trim(),
      })),
    [availableStudentsForParent],
  );

  const parentOptions = useMemo(
    () =>
      (allParents ?? []).map((p) => ({
        value: p.id,
        label: `${p.full_name}${p.email ? ` · ${p.email}` : ""}`,
        keywords: `${p.full_name} ${p.email ?? ""}`.trim(),
      })),
    [allParents],
  );

  const schoolOptions = useMemo(
    () =>
      (allSchools ?? []).map((s) => ({
        value: s.id,
        label: `${s.name}${s.city ? ` · ${s.city}` : s.country ? ` · ${s.country}` : ""}`,
        keywords: `${s.name} ${s.city ?? ""} ${s.country ?? ""}`.trim(),
      })),
    [allSchools],
  );


  const counts = data?.counts;

  // Fetch user accounts overview for admin visibility
  const { data: userAccounts, isLoading: userAccountsLoading } = useQuery({
    queryKey: ["admin-user-accounts"],
    queryFn: async () => {
      // Get all users who have roles assigned (from user_roles table)
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .order("created_at", { ascending: false });

      if (rolesError) {
        throw new Error("Failed to load user roles");
      }

      // Get profile information for these users
      const userIds = [...new Set(userRoles?.map(ur => ur.user_id) || [])];

      if (userIds.length === 0) {
        return [];
      }

      const [
        { data: students, error: studentsError },
        { data: parents, error: parentsError },
        { data: schools, error: schoolsError },
      ] = await Promise.all([
        supabase.from("students").select("user_id, full_name").in("user_id", userIds),
        supabase.from("parents").select("user_id, full_name").in("user_id", userIds),
        supabase.from("schools").select("user_id, name").in("user_id", userIds),
      ]);

      if (studentsError || parentsError || schoolsError) {
        throw new Error("Failed to load user profiles");
      }

      // Group roles by user_id
      const rolesByUser = new Map<string, string[]>();
      userRoles?.forEach(ur => {
        if (!rolesByUser.has(ur.user_id)) {
          rolesByUser.set(ur.user_id, []);
        }
        rolesByUser.get(ur.user_id)!.push(ur.role);
      });

      // Create profile maps
      const studentMap = new Map(students?.map(s => [s.user_id, s]) || []);
      const parentMap = new Map(parents?.map(p => [p.user_id, p]) || []);
      const schoolMap = new Map(schools?.map(s => [s.user_id, s]) || []);

      // Combine all user accounts
      const userAccounts = userIds.map(userId => ({
        user_id: userId,
        roles: rolesByUser.get(userId) || [],
        student_name: studentMap.get(userId)?.full_name || null,
        parent_name: parentMap.get(userId)?.full_name || null,
        school_name: schoolMap.get(userId)?.name || null,
      }));

      return userAccounts;
    },
  });

  const handleAnnouncementChange = (field: keyof z.infer<typeof announcementSchema>, value: unknown) => {
    setAnnouncementValues((prev) => ({ ...prev, [field]: value } as any));
    setAnnouncementErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError(null);

    if (!isSuperAdmin) {
      setStudentFormError("This action requires super admin permission.");
      return;
    }

    const parsed = createStudentSchema.safeParse(studentForm);
    if (!parsed.success) {
      setStudentFormError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setCreatingStudent(true);
    try {
      const v = parsed.data;

      // For Lovable cloud: Since has_role() function isn't working, we'll try direct insert
      // The user has confirmed super_admin role, so this should work with proper RLS bypass

      // Since user has super_admin role (confirmed in console), try direct insert
      // The RLS policy should allow this via the has_role conditions
      console.log("Creating student with super_admin permissions:", {
        user_id: v.user_id,
        full_name: v.full_name,
        school_id: v.school_id,
        current_user: user?.id,
        user_roles: roles
      });

      const { error } = await supabase.from("students").insert({
        user_id: v.user_id,
        full_name: v.full_name,
        class_level: v.class_level || null,
        batch: v.batch || null,
        gender: v.gender || null,
        age: (v.age as unknown as number | null) ?? null,
        school_id: v.school_id || null,
      });

      console.log("Student creation result:", error);

      if (error) {
        console.error("Student creation failed:", error);

        // Provide detailed debugging info
        const debugInfo = {
          error_code: error.code,
          error_message: error.message,
          user_id: user?.id,
          user_roles: roles,
          target_user_id: v.user_id,
          school_id: v.school_id
        };
        console.error("Debug info:", debugInfo);

        // Handle specific error cases
        if (error.message.includes("violates foreign key constraint") || error.message.includes("foreign key")) {
          setStudentFormError("User account not found. Please verify the User ID is correct.");
          return;
        }
        if (error.message.includes("duplicate key") || error.message.includes("unique constraint") || error.code === "23505") {
          setStudentFormError("This user already has a student profile.");
          return;
        }
        if (error.message.includes("permission") || error.message.includes("policy") || error.message.includes("violates row-level security")) {
          setStudentFormError(`Database permission denied. Debug info logged to console. You have super_admin role but RLS is blocking access.`);
          return;
        }

        setStudentFormError(`Failed to create student profile: ${error.message}`);
        return;
      }

      if (error) {
        console.error("Student creation error:", error);
        // Handle common error cases with user-friendly messages
        if (error.message.includes("violates foreign key constraint") || error.message.includes("foreign key")) {
          setStudentFormError("User account not found. Please verify the User ID is correct.");
          return;
        }
        if (error.message.includes("duplicate key") || error.message.includes("unique constraint") || error.code === "23505") {
          setStudentFormError("This user already has a student profile.");
          return;
        }
        if (error.message.includes("permission") || error.message.includes("policy") || error.message.includes("violates row-level security")) {
          setStudentFormError("Permission denied. Please ensure you have super admin access and try again.");
          return;
        }
        setStudentFormError(`Failed to create student profile: ${error.message}`);
        return;
      }

      toast({ title: "Student profile created", description: "You can now link this student to a parent and/or school." });
      setStudentForm({ user_id: "", full_name: "", class_level: "", batch: "", gender: "", age: "", school_id: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-students"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] }),
      ]);
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleLinkParentToStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentStudentError(null);

    if (!isSuperAdmin) {
      setParentStudentError("This action requires super admin permission.");
      return;
    }

    const parsed = linkParentStudentSchema.safeParse(parentStudentForm);
    if (!parsed.success) {
      setParentStudentError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setLinkingParentStudent(true);
    try {
      const v = parsed.data;

      const { data: existing, error: existingError } = await supabase
        .from("parent_students")
        .select("id")
        .eq("parent_id", v.parent_id)
        .eq("student_id", v.student_id)
        .maybeSingle();

      if (existingError) {
        setParentStudentError("Failed to check existing links. Please try again.");
        return;
      }

      if (existing) {
        toast({ title: "Already linked", description: "That parent is already linked to the selected student." });
        return;
      }

      const { error } = await supabase.from("parent_students").insert({
        parent_id: v.parent_id,
        student_id: v.student_id,
        relationship: v.relationship || null,
      });

      if (error) {
        setParentStudentError("This action requires super admin permission.");
        return;
      }

      toast({ title: "Linked", description: "Parent and student are now connected." });
      setParentStudentForm({ parent_id: "", student_id: "", relationship: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
    } finally {
      setLinkingParentStudent(false);
    }
  };

  const handleAssignSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSchoolError(null);

    if (!isSuperAdmin) {
      setAssignSchoolError("This action requires super admin permission.");
      return;
    }

    const parsed = assignSchoolSchema.safeParse(assignSchoolForm);
    if (!parsed.success) {
      setAssignSchoolError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setAssigningSchool(true);
    try {
      const v = parsed.data;
      const schoolId = v.school_id ? v.school_id : null;

      const { error } = await supabase.from("students").update({ school_id: schoolId }).eq("id", v.student_id);

      if (error) {
        setAssignSchoolError("This action requires super admin permission.");
        return;
      }

      toast({
        title: "School updated",
        description: schoolId ? "Student is now assigned to the selected school." : "Student is now independent (no school).",
      });
      setAssignSchoolForm({ student_id: "", school_id: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-students"] }),
      ]);
    } finally {
      setAssigningSchool(false);
    }
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
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
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
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
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
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleUpdateProject = async (project: ProjectRow, updates: Partial<ProjectRow>) => {
    setProcessingProjectId(project.id);
    try {
      const { error: updateError } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", project.id);

      if (updateError) {
        toast({
          title: "Could not update project",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Project updated",
        description: "Project flags were updated successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
    } finally {
      setProcessingProjectId(null);
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs self-start"
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
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Control centre</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/70 p-1 text-[10px] sm:grid-cols-3 lg:flex lg:text-[11px]">
                <TabsTrigger value="approvals" className="text-center">Approvals</TabsTrigger>
                <TabsTrigger value="profiles" className="text-center">Profiles</TabsTrigger>
                <TabsTrigger value="users" className="text-center">Users</TabsTrigger>
                <TabsTrigger value="projects" className="text-center">Projects</TabsTrigger>
                <TabsTrigger value="payments" className="text-center">Payments</TabsTrigger>
                <TabsTrigger value="announcements" className="text-center">Announce</TabsTrigger>
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
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="text-sm font-semibold tracking-tight">Profiles &amp; linking</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Create a learner profile, link a learner to a parent, and assign a learner to a school — all from one
                        place.
                      </p>
                    </CardHeader>

                    <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
                      <form onSubmit={handleCreateStudent} className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                          Create student
                        </p>
                        <div className="mt-3 space-y-3 text-xs">
                          <div className="space-y-1">
                            <Label htmlFor="student-user-id">User ID</Label>
                            <Input
                              id="student-user-id"
                              value={studentForm.user_id}
                              onChange={(e) => setStudentForm((p) => ({ ...p, user_id: e.target.value }))}
                              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                              required
                              disabled={creatingStudent}
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Enter the user's UUID from Supabase dashboard or user communications.
                            </p>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="student-full-name">Full name</Label>
                            <Input
                              id="student-full-name"
                              value={studentForm.full_name}
                              onChange={(e) => setStudentForm((p) => ({ ...p, full_name: e.target.value }))}
                              placeholder="e.g. Chinedu Okoye"
                              required
                              disabled={creatingStudent}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="student-class">Class</Label>
                              <Input
                                id="student-class"
                                value={studentForm.class_level}
                                onChange={(e) => setStudentForm((p) => ({ ...p, class_level: e.target.value }))}
                                placeholder="JSS 2"
                                disabled={creatingStudent}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="student-batch">Cohort</Label>
                              <Input
                                id="student-batch"
                                value={studentForm.batch}
                                onChange={(e) => setStudentForm((p) => ({ ...p, batch: e.target.value }))}
                                placeholder="2026"
                                disabled={creatingStudent}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="student-gender">Gender</Label>
                              <Input
                                id="student-gender"
                                value={studentForm.gender}
                                onChange={(e) => setStudentForm((p) => ({ ...p, gender: e.target.value }))}
                                placeholder="Female"
                                disabled={creatingStudent}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="student-age">Age</Label>
                              <Input
                                id="student-age"
                                inputMode="numeric"
                                value={studentForm.age}
                                onChange={(e) => setStudentForm((p) => ({ ...p, age: e.target.value }))}
                                placeholder="12"
                                disabled={creatingStudent}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label>School (optional)</Label>
                            <Combobox
                              items={schoolOptions}
                              value={studentForm.school_id || null}
                              onValueChange={(value) => setStudentForm((p) => ({ ...p, school_id: value }))}
                              placeholder={(schoolOptions.length ? "Select school" : "No schools available") as string}
                              disabled={!schoolOptions.length || creatingStudent}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => setStudentForm((p) => ({ ...p, school_id: "" }))}
                              disabled={!studentForm.school_id || creatingStudent}
                            >
                              Clear school
                            </Button>
                          </div>

                          {studentFormError && <p className="text-[11px] text-destructive">{studentFormError}</p>}

                          <Button type="submit" size="sm" className="w-full text-[11px]" disabled={creatingStudent}>
                            {creatingStudent ? "Creating..." : "Create student"}
                          </Button>
                        </div>
                      </form>

                      <form onSubmit={handleLinkParentToStudent} className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                          Link parent → student
                        </p>
                        <div className="mt-3 space-y-3 text-xs">
                          <div className="space-y-1">
                            <Label>Parent</Label>
                            <Combobox
                              items={parentOptions}
                              value={parentStudentForm.parent_id || null}
                              onValueChange={(value) => {
                                setParentStudentForm((p) => ({ ...p, parent_id: value, student_id: "" }));
                              }}
                              placeholder={(parentOptions.length ? "Select parent" : "No approved parents yet. Parent must sign up first.") as string}
                              disabled={!parentOptions.length || linkingParentStudent}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>Student</Label>
                            <Combobox
                              items={availableStudentOptionsForParent}
                              value={parentStudentForm.student_id || null}
                              onValueChange={(value) => setParentStudentForm((p) => ({ ...p, student_id: value }))}
                              placeholder={
                                !parentStudentForm.parent_id
                                  ? "Select a parent first"
                                  : availableStudentOptionsForParent.length
                                    ? "Select student to link"
                                    : "No available students for this parent"
                              }
                              disabled={!parentStudentForm.parent_id || !availableStudentOptionsForParent.length || linkingParentStudent}
                            />
                            {parentStudentForm.parent_id && availableStudentOptionsForParent.length === 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                All students are already linked to this parent.
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="relationship">Relationship (optional)</Label>
                            <Input
                              id="relationship"
                              value={parentStudentForm.relationship}
                              onChange={(e) => setParentStudentForm((p) => ({ ...p, relationship: e.target.value }))}
                              placeholder="e.g. Father, Mother, Guardian"
                            />
                          </div>

                          {parentStudentError && <p className="text-[11px] text-destructive">{parentStudentError}</p>}

                          <Button
                            type="submit"
                            size="sm"
                            className="w-full text-[11px]"
                            disabled={linkingParentStudent}
                          >
                            {linkingParentStudent ? "Linking..." : "Link parent"}
                          </Button>
                        </div>
                      </form>

                      <form onSubmit={handleAssignSchool} className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                          Assign student → school
                        </p>
                        <div className="mt-3 space-y-3 text-xs">
                          <div className="space-y-1">
                            <Label>Student</Label>
                            <Combobox
                              items={studentOptions}
                              value={assignSchoolForm.student_id || null}
                              onValueChange={(value) => setAssignSchoolForm((p) => ({ ...p, student_id: value }))}
                              placeholder={(studentOptions.length ? "Select student" : "No students available") as string}
                              disabled={!studentOptions.length || assigningSchool}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>School (optional)</Label>
                            <Combobox
                              items={schoolOptions}
                              value={assignSchoolForm.school_id || null}
                              onValueChange={(value) => setAssignSchoolForm((p) => ({ ...p, school_id: value }))}
                              placeholder={(schoolOptions.length ? "Select school" : "No schools available") as string}
                              disabled={!schoolOptions.length || assigningSchool}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => setAssignSchoolForm((p) => ({ ...p, school_id: "" }))}
                              disabled={!assignSchoolForm.school_id}
                            >
                              Clear school
                            </Button>
                          </div>

                          {assignSchoolError && <p className="text-[11px] text-destructive">{assignSchoolError}</p>}

                          <Button type="submit" size="sm" className="w-full text-[11px]" disabled={assigningSchool}>
                            {assigningSchool ? "Saving..." : "Save assignment"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                    <CardHeader className="p-4 pb-3">
                      <CardTitle className="text-sm font-semibold tracking-tight">Recent profiles</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">Quick sanity-check that new accounts are appearing.</p>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-4 pt-0 md:grid-cols-3 lg:grid-cols-1">
                      <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
                          Recent students
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {data?.profileSummary.students.map((student) => (
                            <li key={student.id} className="flex items-center justify-between gap-2">
                              <div className="flex-1 truncate">
                                <span className="text-foreground">{student.full_name}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">{student.class_level || "Class ?"}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (!confirm(`Delete student profile for ${student.full_name}? This action cannot be undone.`)) {
                                    return;
                                  }

                                  try {
                                    const { error } = await supabase
                                      .from("students")
                                      .delete()
                                      .eq("id", student.id);

                                    if (error) {
                                      toast({
                                        title: "Failed to delete student",
                                        description: error.message,
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    toast({
                                      title: "Student deleted",
                                      description: "Student profile has been removed."
                                    });

                                    // Refresh the data
                                    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                    await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                  } catch (err) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete student profile.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                🗑️
                              </Button>
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
                              <div className="flex-1 truncate">
                                <span className="text-foreground">{parent.full_name}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">{parent.email || "Email ?"}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (!confirm(`Delete parent profile for ${parent.full_name}? This action cannot be undone.`)) {
                                    return;
                                  }

                                  try {
                                    const { error } = await supabase
                                      .from("parents")
                                      .delete()
                                      .eq("id", parent.id);

                                    if (error) {
                                      toast({
                                        title: "Failed to delete parent",
                                        description: error.message,
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    toast({
                                      title: "Parent deleted",
                                      description: "Parent profile has been removed."
                                    });

                                    // Refresh the data
                                    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                    await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                  } catch (err) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete parent profile.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                🗑️
                              </Button>
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
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold tracking-tight">User accounts overview</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          View all approved user accounts. Use User IDs to create student profiles.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] })}
                        disabled={userAccountsLoading}
                        className="text-[11px]"
                      >
                        {userAccountsLoading ? "Loading..." : "Refresh"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {userAccountsLoading ? (
                      <div className="p-6 text-center">
                        <div className="text-xs text-muted-foreground">Loading user accounts...</div>
                      </div>
                    ) : userAccounts && userAccounts.length > 0 ? (
                      <ScrollArea className="max-h-[500px]">
                        <Table className="min-w-full text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>User ID</TableHead>
                              <TableHead>Roles</TableHead>
                              <TableHead>Student Profile</TableHead>
                              <TableHead>Parent Profile</TableHead>
                              <TableHead>School Profile</TableHead>
                              <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userAccounts.map((account) => (
                              <TableRow key={account.user_id}>
                                <TableCell className="font-mono text-[11px] font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-32">{account.user_id}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        navigator.clipboard.writeText(account.user_id);
                                        toast({ title: "Copied!", description: "User ID copied to clipboard" });
                                      }}
                                    >
                                      📋
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {account.roles.map((role) => (
                                      <Badge key={role} variant="secondary" className="text-[10px] capitalize">
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{account.student_name || "—"}</span>
                                    {account.student_name && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                                        onClick={async () => {
                                          if (!confirm(`Delete student profile for ${account.student_name}? This action cannot be undone.`)) {
                                            return;
                                          }

                                          try {
                                            const { error } = await supabase
                                              .from("students")
                                              .delete()
                                              .eq("user_id", account.user_id);

                                            if (error) {
                                              toast({
                                                title: "Failed to delete student",
                                                description: error.message,
                                                variant: "destructive"
                                              });
                                              return;
                                            }

                                            toast({
                                              title: "Student deleted",
                                              description: "Student profile has been removed."
                                            });

                                            await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                            await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                          } catch (err) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to delete student profile.",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                      >
                                        🗑️
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{account.parent_name || "—"}</span>
                                    {account.parent_name && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                                        onClick={async () => {
                                          if (!confirm(`Delete parent profile for ${account.parent_name}? This action cannot be undone.`)) {
                                            return;
                                          }

                                          try {
                                            const { error } = await supabase
                                              .from("parents")
                                              .delete()
                                              .eq("user_id", account.user_id);

                                            if (error) {
                                              toast({
                                                title: "Failed to delete parent",
                                                description: error.message,
                                                variant: "destructive"
                                              });
                                              return;
                                            }

                                            toast({
                                              title: "Parent deleted",
                                              description: "Parent profile has been removed."
                                            });

                                            await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                            await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                          } catch (err) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to delete parent profile.",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                      >
                                        🗑️
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{account.school_name || "—"}</span>
                                    {account.school_name && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                                        onClick={async () => {
                                          if (!confirm(`Delete school profile for ${account.school_name}? This action cannot be undone.`)) {
                                            return;
                                          }

                                          try {
                                            const { error } = await supabase
                                              .from("schools")
                                              .delete()
                                              .eq("user_id", account.user_id);

                                            if (error) {
                                              toast({
                                                title: "Failed to delete school",
                                                description: error.message,
                                                variant: "destructive"
                                              });
                                              return;
                                            }

                                            toast({
                                              title: "School deleted",
                                              description: "School profile has been removed."
                                            });

                                            await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                            await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                                          } catch (err) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to delete school profile.",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                      >
                                        🗑️
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        <p>No approved user accounts found.</p>
                        <p className="mt-1">Users appear here after registration and admin approval.</p>
                        <p className="mt-2 text-[11px]">
                          Check the "Approvals & roles" tab to approve new registrations.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="mt-4">
                <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                  <Card className="rounded-3xl border-border/70 bg-card shadow-[var(--shadow-soft)]">
                    <CardHeader className="flex items-center justify-between gap-3 p-4 pb-3">
                      <div>
                        <CardTitle className="text-sm font-semibold tracking-tight">Recent projects</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Spot-check what learners and schools are recording, and confirm which projects are in the public
                          gallery pipeline.
                        </p>
                      </div>
                      <DialogTrigger asChild>
                        <Button size="sm" className="text-[11px]">
                          Upload project
                        </Button>
                      </DialogTrigger>
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
                                <TableHead>Featuring</TableHead>
                                <TableHead>Approved</TableHead>
                                <TableHead>Created at</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                    <div className="flex flex-wrap gap-1.5">
                                      <Badge
                                        variant={project.is_public_gallery ? "secondary" : "outline"}
                                        className="text-[10px]"
                                      >
                                        Public gallery
                                      </Badge>
                                      <Badge
                                        variant={project.is_school_gallery ? "secondary" : "outline"}
                                        className="text-[10px]"
                                      >
                                        School gallery
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-[11px] text-muted-foreground">
                                    <div className="flex flex-wrap gap-1.5">
                                      <Badge
                                        variant={project.is_featured_homepage ? "secondary" : "outline"}
                                        className="text-[10px]"
                                      >
                                        Featured home
                                      </Badge>
                                      <Badge
                                        variant={project.is_platform_showcase ? "secondary" : "outline"}
                                        className="text-[10px]"
                                      >
                                        Platform showcase
                                      </Badge>
                                    </div>
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
                                  <TableCell className="text-right">
                                    <div className="flex flex-wrap justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        variant={project.approved_by_admin ? "outline" : "secondary"}
                                        disabled={processingProjectId === project.id}
                                        onClick={() =>
                                          void handleUpdateProject(project, {
                                            approved_by_admin: !project.approved_by_admin,
                                          })
                                        }
                                        className="h-7 px-2 text-[10px]"
                                      >
                                        {processingProjectId === project.id
                                          ? "Saving..."
                                          : project.approved_by_admin
                                            ? "Unapprove"
                                            : "Approve"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={project.is_public_gallery ? "outline" : "ghost"}
                                        disabled={processingProjectId === project.id}
                                        onClick={() =>
                                          void handleUpdateProject(project, {
                                            is_public_gallery: !project.is_public_gallery,
                                            ...(project.is_public_gallery
                                              ? {}
                                              : { visibility: "public" as ProjectRow["visibility"] }),
                                          })
                                        }
                                        className="h-7 px-2 text-[10px]"
                                      >
                                        {processingProjectId === project.id
                                          ? "Saving..."
                                          : project.is_public_gallery
                                            ? "Remove public"
                                            : "Make public"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={project.is_school_gallery ? "outline" : "ghost"}
                                        disabled={processingProjectId === project.id}
                                        onClick={() =>
                                          void handleUpdateProject(project, {
                                            is_school_gallery: !project.is_school_gallery,
                                          })
                                        }
                                        className="h-7 px-2 text-[10px]"
                                      >
                                        {processingProjectId === project.id
                                          ? "Saving..."
                                          : project.is_school_gallery
                                            ? "Remove school"
                                            : "School gallery"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={project.is_featured_homepage ? "outline" : "ghost"}
                                        disabled={processingProjectId === project.id}
                                        onClick={() =>
                                          void handleUpdateProject(project, {
                                            is_featured_homepage: !project.is_featured_homepage,
                                          })
                                        }
                                        className="h-7 px-2 text-[10px]"
                                      >
                                        {processingProjectId === project.id
                                          ? "Saving..."
                                          : project.is_featured_homepage
                                            ? "Unfeature home"
                                            : "Feature home"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={project.is_platform_showcase ? "outline" : "ghost"}
                                        disabled={processingProjectId === project.id}
                                        onClick={() =>
                                          void handleUpdateProject(project, {
                                            is_platform_showcase: !project.is_platform_showcase,
                                          })
                                        }
                                        className="h-7 px-2 text-[10px]"
                                      >
                                        {processingProjectId === project.id
                                          ? "Saving..."
                                          : project.is_platform_showcase
                                            ? "Unmark showcase"
                                            : "Mark showcase"}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-start gap-3 p-6 text-xs text-muted-foreground">
                          <p>No projects have been logged yet.</p>
                          <p>
                            Start by uploading a first featured project. This will feed the homepage gallery and the public
                            proof section.
                          </p>
                          <DialogTrigger asChild>
                            <Button size="sm" className="text-[11px]">
                              Upload first project
                            </Button>
                          </DialogTrigger>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-sm">Upload project</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 space-y-3 text-xs">
                      <div className="space-y-1.5">
                        <label htmlFor="project-title" className="text-[11px] font-medium text-foreground">
                          Project title
                        </label>
                        <Input
                          id="project-title"
                          value={projectForm.title}
                          onChange={(e) => {
                            setProjectForm((prev) => ({ ...prev, title: e.target.value }));
                            setProjectErrors((prev) => ({ ...prev, title: undefined }));
                          }}
                          disabled={creatingProject}
                          placeholder="e.g. AI-powered waste sorting app"
                        />
                        {projectErrors.title && (
                          <p className="text-[11px] text-destructive">{projectErrors.title}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="project-description" className="text-[11px] font-medium text-foreground">
                          Description
                        </label>
                        <Textarea
                          id="project-description"
                          value={projectForm.description}
                          onChange={(e) =>
                            setProjectForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          disabled={creatingProject}
                          rows={4}
                          placeholder="Short explanation of what the learner built and why it matters."
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-foreground">Project type</span>
                          <div className="flex flex-wrap gap-2">
                            {Constants.public.Enums.media_type.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setProjectForm((prev) => ({ ...prev, mediaType: type as ProjectRow["media_type"] }));
                                  setProjectErrors((prev) => ({ ...prev, mediaType: undefined }));
                                }}
                                className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                                  projectForm.mediaType === type
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {type.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                          {projectErrors.mediaType && (
                            <p className="text-[11px] text-destructive">{projectErrors.mediaType}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="project-student" className="text-[11px] font-medium text-foreground">
                            Assign to learner (optional)
                          </label>
                          <select
                            id="project-student"
                            value={projectForm.studentId}
                            onChange={(e) =>
                              setProjectForm((prev) => ({ ...prev, studentId: e.target.value || "" }))
                            }
                            disabled={creatingProject}
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">No specific learner (platform showcase)</option>
                            {allStudents?.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.full_name}
                                {student.batch ? ` • ${student.batch}` : ""}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-muted-foreground">
                            Optional – link this project to a specific learner to show it on their dashboard.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="project-external" className="text-[11px] font-medium text-foreground">
                          External link (live demo, video or repo)
                        </label>
                        <Input
                          id="project-external"
                          value={projectForm.externalUrl}
                          onChange={(e) =>
                            setProjectForm((prev) => ({ ...prev, externalUrl: e.target.value }))
                          }
                          disabled={creatingProject}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="project-thumbnail" className="text-[11px] font-medium text-foreground">
                          Thumbnail image
                        </label>
                        <Input
                          id="project-thumbnail"
                          type="file"
                          accept="image/*"
                          disabled={creatingProject}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setProjectForm((prev) => ({ ...prev, thumbnailFile: file }));
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Upload a clear PNG or JPG. This will be used in the homepage and public gallery.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-foreground">Visibility</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setProjectForm((prev) => ({
                                ...prev,
                                isPublicGallery: !prev.isPublicGallery,
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                              projectForm.isPublicGallery
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Public gallery
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProjectForm((prev) => ({
                                ...prev,
                                isFeaturedHomepage: !prev.isFeaturedHomepage,
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                              projectForm.isFeaturedHomepage
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Feature on homepage
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProjectForm((prev) => ({
                                ...prev,
                                isPlatformShowcase: !prev.isPlatformShowcase,
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                              projectForm.isPlatformShowcase
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Mark as platform showcase
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Projects shown publicly will always be marked as approved and visible, but you stay in full
                          control.
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[11px]"
                          disabled={creatingProject}
                          onClick={() => setProjectDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="text-[11px]"
                          disabled={creatingProject}
                          onClick={async () => {
                            if (!user) return;

                            const errors: typeof projectErrors = {};
                            if (!projectForm.title.trim()) {
                              errors.title = "Title is required";
                            }
                            if (!projectForm.mediaType) {
                              errors.mediaType = "Choose a project type";
                            }

                            if (Object.keys(errors).length) {
                              setProjectErrors(errors);
                              return;
                            }

                            setCreatingProject(true);
                            try {
                              const assignedStudent =
                                projectForm.studentId && allStudents
                                  ? allStudents.find((s) => s.id === projectForm.studentId)
                                  : undefined;

                              const visibility: ProjectRow["visibility"] =
                                projectForm.isPublicGallery || projectForm.isFeaturedHomepage
                                  ? "public"
                                  : "private";

                              let thumbnailUrl: string | null = null;
                              if (projectForm.thumbnailFile) {
                                const file = projectForm.thumbnailFile;
                                const filePath = `${user.id}/${Date.now()}-${file.name}`;

                                const { error: uploadError } = await supabase.storage
                                  .from("project-thumbnails")
                                  .upload(filePath, file, {
                                    cacheControl: "3600",
                                    upsert: false,
                                  });

                                if (uploadError) {
                                  toast({
                                    title: "Could not upload image",
                                    description: uploadError.message,
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                const { data: publicUrlData } = supabase.storage
                                  .from("project-thumbnails")
                                  .getPublicUrl(filePath);
                                thumbnailUrl = publicUrlData?.publicUrl ?? null;
                              }

                              const { error: insertError } = await supabase.from("projects").insert({
                                title: projectForm.title.trim(),
                                description: projectForm.description.trim() || null,
                                media_type: projectForm.mediaType,
                                visibility,
                                is_public_gallery: projectForm.isPublicGallery,
                                is_featured_homepage: projectForm.isFeaturedHomepage,
                                is_platform_showcase: projectForm.isPlatformShowcase,
                                student_id: assignedStudent?.id ?? null,
                                school_id: assignedStudent?.school_id ?? null,
                                cohort: assignedStudent?.batch ?? null,
                                external_url: projectForm.externalUrl.trim() || null,
                                thumbnail_url: thumbnailUrl,
                                uploaded_by_user_id: user.id,
                                uploaded_by_role: "super_admin" as ProjectRow["uploaded_by_role"],
                                approved_by_admin: true,
                              });

                              if (insertError) {
                                toast({
                                  title: "Could not upload project",
                                  description: insertError.message,
                                  variant: "destructive",
                                });
                                return;
                              }

                              toast({
                                title: "Project uploaded",
                                description:
                                  "The project has been added. It will now appear in the homepage gallery and public projects where applicable.",
                              });

                              setProjectForm({
                                title: "",
                                description: "",
                                mediaType: "web_app" as ProjectRow["media_type"],
                                externalUrl: "",
                                thumbnailUrl: "",
                                thumbnailFile: null,
                                studentId: "",
                                isPublicGallery: true,
                                isFeaturedHomepage: true,
                                isPlatformShowcase: false,
                              });
                              setProjectErrors({});
                              setProjectDialogOpen(false);
                              await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-user-accounts"] });
                            } finally {
                              setCreatingProject(false);
                            }
                          }}
                        >
                          {creatingProject ? "Uploading..." : "Save project"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                                <TableCell className="max-w-[180px] text-[11px] text-muted-foreground">
                                  <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                      {((payment.metadata as Record<string, unknown> | null)?.child_name as string | undefined) || "—"}
                                    </p>
                                    <p>
                                      {((payment.metadata as Record<string, unknown> | null)?.child_age as string | undefined) || "—"} · {((payment.metadata as Record<string, unknown> | null)?.child_class as string | undefined) || "—"}
                                    </p>
                                    <p>{((payment.metadata as Record<string, unknown> | null)?.parent_email as string | undefined) || "—"}</p>
                                  </div>
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
