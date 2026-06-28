import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainNavbar } from "@/components/MainNavbar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, type AppRole } from "@/hooks/useUserRoles";
import { getPrimaryDashboardPath } from "@/lib/roleRouting";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password is too long" }),
});

type AuthFormValues = z.infer<typeof authSchema>;

const ADMIN_EMAIL = "divinetonyezimchukwu@gmail.com";

type SelectableRole = Extract<AppRole, "student" | "parent" | "school">;

export const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [values, setValues] = useState<AuthFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormValues, string>>>({});
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
  const [resetValues, setResetValues] = useState({ password: "", confirmPassword: "" });
  const [resetError, setResetError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const isResetFlow = searchParams.get("reset") === "1";

  const { user } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();

  // If we came back from a password recovery email link, complete the session and show the reset form.
  useEffect(() => {
    if (!isResetFlow) return;

    setMode("reset");
    setResetError(null);

    const completeRecovery = async () => {
      try {
        const code = searchParams.get("code");

        // PKCE flow (most common)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          return;
        }

        // Legacy implicit flow (access_token in hash)
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (type === "recovery" && access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        }
      } catch (err: any) {
        setResetError(err?.message ?? "Reset link is invalid or expired. Please request a new one.");
      }
    };

    void completeRecovery();
  }, [isResetFlow, searchParams]);

  // When a logged-in user already has a role, redirect them away from /auth
  useEffect(() => {
    if (isResetFlow) return; // stay on this page for password reset
    if (!user || rolesLoading) return;
    if (!roles || roles.length === 0) return;

    const target =
      redirectTo && redirectTo !== "/auth"
        ? redirectTo
        : getPrimaryDashboardPath(roles, "/");

    navigate(target, { replace: true });
  }, [user, rolesLoading, roles, redirectTo, navigate, isResetFlow]);

  const handleChange = (field: keyof AuthFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleResetChange = (field: "password" | "confirmPassword", value: string) => {
    setResetValues((prev) => ({ ...prev, [field]: value }));
    setResetError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "forgot") {
      const emailResult = authSchema.shape.email.safeParse(values.email);
      if (!emailResult.success) {
        setErrors((prev) => ({
          ...prev,
          email: emailResult.error.issues[0]?.message ?? "Enter a valid email",
        }));
        return;
      }

      setLoading(true);
      try {
        const redirectUrl = `${window.location.origin}/auth?reset=1`;
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: redirectUrl,
        });

        if (error) {
          toast({
            title: "Password reset failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Check your email",
          description: "We sent you a secure link to reset your password.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "reset") {
      const password = resetValues.password.trim();
      const confirmPassword = resetValues.confirmPassword.trim();

      if (password.length < 6) {
        setResetError("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setResetError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        toast({
          title: "Password updated",
          description: "You can now sign in with your new password.",
        });

        // Clean up reset params/hash so we don't re-trigger reset flow.
        window.history.replaceState({}, "", "/auth");
        setMode("login");
        setResetValues({ password: "", confirmPassword: "" });
      } catch (err: any) {
        setResetError(err?.message ?? "Could not update password. Please request a new reset link.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsed = authSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof AuthFormValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AuthFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (mode === "login" && !selectedRole) {
      toast({
        title: "Pick how you are accessing",
        description: "Choose Student, Parent, or School before signing in.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        const signedInUser = data.user;

        // Ensure the super admin email always receives the super_admin role
        if (signedInUser?.email && signedInUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          const { data: adminRoles, error: adminFetchError } = await supabase
            .from("user_roles")
            .select("id, role")
            .eq("user_id", signedInUser.id);

          if (!adminFetchError) {
            const alreadySuperAdmin = adminRoles?.some((r) => r.role === "super_admin");
            if (!alreadySuperAdmin) {
              await supabase.from("user_roles").insert({ user_id: signedInUser.id, role: "super_admin" });
            }
          }
        }

        // After successful login, ensure the chosen non-admin role exists
        if (signedInUser && selectedRole) {
          const { data: existingRoles, error: fetchError } = await supabase
            .from("user_roles")
            .select("id, role")
            .eq("user_id", signedInUser.id);

          if (!fetchError) {
            const alreadyHasRole = existingRoles?.some((r) => r.role === selectedRole);
            if (!alreadyHasRole) {
              const { error: insertError } = await supabase.from("user_roles").insert({
                user_id: signedInUser.id,
                role: selectedRole,
              });

              if (insertError) {
                toast({
                  title: "Could not set role",
                  description: insertError.message,
                  variant: "destructive",
                });
                return;
              }
            }
          }
        }

        toast({
          title: "Welcome back",
          description: "You are now signed in.",
        });

        // Immediately send the user to the dashboard for the role they chose
        const explicitTarget =
          redirectTo && redirectTo !== "/auth"
            ? redirectTo
            : selectedRole === "student"
              ? "/student"
              : selectedRole === "parent"
                ? "/parent"
                : selectedRole === "school"
                  ? "/school"
                  : "/";

        navigate(explicitTarget, { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your signup.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login" ? "Sign in" : mode === "signup" ? "Create an account" : mode === "forgot" ? "Forgot password" : "Reset password";

  const renderRolePicker = () => {
    if (mode !== "login") return null;

    const roles: { value: SelectableRole; label: string; description: string }[] = [
      {
        value: "student",
        label: "Student",
        description: "I am a learner building and submitting projects.",
      },
      {
        value: "parent",
        label: "Parent / Guardian",
        description: "I want to track my child’s progress and certificates.",
      },
      {
        value: "school",
        label: "School / Program Lead",
        description: "I manage cohorts and showcase school projects.",
      },
    ];

    return (
      <div className="space-y-2">
        <Label>Who is signing in?</Label>
        <p className="text-[11px] text-muted-foreground">
          This helps us send you to the right dashboard. You can change this later with support.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelectedRole(role.value)}
              className={
                "flex flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left text-xs transition-all duration-300 hover-scale interactive-button " +
                (selectedRole === role.value
                  ? "border-primary bg-primary/5 text-foreground shadow-md"
                  : "border-border/70 bg-card/80 text-muted-foreground hover:border-accent hover:bg-card hover:shadow-sm")
              }
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/90">
                {role.label}
              </span>
              <span className="text-[11px] leading-snug">{role.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title}
        description="Secure access to the AI Innovators Portal for parents, students and schools."
        canonical={`${window.location.origin}/auth`}
      />
      <main className="container flex min-h-screen items-center justify-center py-8">
        <div className="grid w-full max-w-md gap-6 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline hover-scale"
            >
              ← Back
            </button>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                AI Innovators Portal
              </p>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            </div>
          </div>

          {mode !== "reset" ? (
            <p className="text-xs text-muted-foreground">
              Use a single account to access student, parent or school dashboards after approval.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enter a new password to finish resetting your account. If your link expired, request a new one.
            </p>
          )}

          {mode !== "reset" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={loading}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={values.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required={mode !== "forgot"}
                  disabled={mode === "forgot"}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="mt-1 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline hover-scale"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {mode === "login" && renderRolePicker()}

              <Button type="submit" variant="hero" className="w-full interactive-button" disabled={loading}>
                {loading
                  ? mode === "forgot"
                    ? "Sending reset link..."
                    : mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                  : mode === "forgot"
                    ? "Send reset link"
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={resetValues.password}
                  onChange={(e) => handleResetChange("password", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={resetValues.confirmPassword}
                  onChange={(e) => handleResetChange("confirmPassword", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {resetError && <p className="text-xs text-destructive">{resetError}</p>}

              <Button type="submit" variant="school" className="w-full interactive-button" disabled={loading}>
                {loading ? "Updating password..." : "Update password"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  window.history.replaceState({}, "", "/auth");
                  setMode("login");
                }}
                className="w-full text-center text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline hover-scale"
              >
                Back to sign in
              </button>
            </form>
          )}

          <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
            {mode === "login" && (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-primary underline-offset-4 hover:underline hover-scale"
                >
                  Create one
                </button>
              </span>
            )}
            {mode === "signup" && (
              <span>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-primary underline-offset-4 hover:underline hover-scale"
                >
                  Sign in
                </button>
              </span>
            )}
            {mode === "forgot" && (
              <span>
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-primary underline-offset-4 hover:underline hover-scale"
                >
                  Back to sign in
                </button>
              </span>
            )}
            <p>
              Public projects remain visible without login. Private dashboards will only unlock once your role and payment are
              approved.
            </p>
            <p>
              <Link to="/" className="text-primary underline-offset-4 hover:underline hover-scale">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
