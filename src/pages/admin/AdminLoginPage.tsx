import { useState, useEffect } from "react";
import { z } from "zod";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

const SUPER_ADMIN_EMAIL = "divinetonyezimchukwu@gmail.com";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
});

type FormValues = z.infer<typeof schema>;

export const AdminLoginPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();

  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || rolesLoading) return;
    const isSuperAdmin = roles.includes("super_admin" as any);
    if (user && isSuperAdmin) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, roles, loading, rolesLoading, navigate]);

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error || !data.user) {
        toast({ title: "Login failed", description: error?.message ?? "Unable to sign in.", variant: "destructive" });
        return;
      }

      const signedInUser = data.user;

      if ((signedInUser.email ?? "").toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        toast({
          title: "Access denied",
          description: "This area is restricted to the Super Admin account only.",
          variant: "destructive",
        });
        return;
      }

      // Ensure profile exists with super_admin role
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("user_id", signedInUser.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: signedInUser.id,
          full_name: "Divine",
          role: "super_admin",
        });
      } else if (existingProfile.role !== "super_admin") {
        await supabase
          .from("profiles")
          .update({ role: "super_admin" })
          .eq("id", existingProfile.id);
      }

      // Ensure user_roles contains super_admin role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", signedInUser.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({ user_id: signedInUser.id, role: "super_admin" });
      }

      toast({
        title: "Welcome, Super Admin",
        description: "You now have secure access to the control centre.",
      });

      navigate("/admin/dashboard", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Super Admin Login"
        description="Secure access to the AI Innovators Super Admin control centre."
        canonical={`${window.location.origin}/admin/login`}
      />
      <main className="container flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
              AI Innovators Portal
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Super Admin sign in</h1>
            <p className="text-xs text-muted-foreground">
              Restricted area for platform oversight, approvals and system monitoring.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={submitting}
                required
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                disabled={submitting}
                required
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Verifying access…" : "Sign in as Super Admin"}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground">
            If you reached this page by mistake, you can safely close the tab or return to the homepage.
          </p>
        </div>
      </main>
    </div>
  );
};
