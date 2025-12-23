import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password is too long" }),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [values, setValues] = useState<AuthFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormValues, string>>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleChange = (field: keyof AuthFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
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

        toast({
          title: "Welcome back",
          description: "You are now signed in.",
        });
        navigate(redirectTo);
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

  const title = mode === "login" ? "Sign in" : "Create an account";

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title}
        description="Secure access to the AI Innovators Portal for parents, students and schools."
        canonical={`${window.location.origin}/auth`}
      />
      <main className="container flex min-h-screen items-center justify-center py-8">
        <div className="grid w-full max-w-md gap-6 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
              AI Innovators Portal
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">
              Use a single account to access student, parent or school dashboards after approval.
            </p>
          </div>

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
                required
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-primary underline-offset-4 hover:underline"
              >
                New here? Create an account instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary underline-offset-4 hover:underline"
              >
                Already registered? Sign in instead
              </button>
            )}
            <p>
              Public projects remain visible without login. Private dashboards will only unlock once your role and payment are
              approved.
            </p>
            <p>
              <Link to="/" className="text-primary underline-offset-4 hover:underline">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
