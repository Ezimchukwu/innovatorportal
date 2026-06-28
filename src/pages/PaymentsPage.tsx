import { MainNavbar } from "@/components/MainNavbar";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const ENROLLMENT_AMOUNT_NGN = 30000; // displayed amount
const ENROLLMENT_AMOUNT_KOBO = ENROLLMENT_AMOUNT_NGN * 100; // Paystack uses kobo

export const PaymentsPage = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childClass, setChildClass] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Enter a valid email",
        description: "We need a valid parent email for the receipt.",
        variant: "destructive",
      });
      return;
    }

    if (!childName.trim()) {
      toast({
        title: "Child name required",
        description: "Please enter the child’s name for enrollment records.",
        variant: "destructive",
      });
      return;
    }

    if (!childAge.trim()) {
      toast({
        title: "Child age required",
        description: "Please enter the child’s age for enrollment records.",
        variant: "destructive",
      });
      return;
    }

    if (!childClass.trim()) {
      toast({
        title: "Child class required",
        description: "Please enter the child’s class for enrollment records.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          amount: ENROLLMENT_AMOUNT_KOBO,
          callback_url: `${window.location.origin}/payments/success`,
          metadata: {
            child_name: childName.trim(),
            child_age: childAge.trim(),
            child_class: childClass.trim(),
            source: "guest_enrollment",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        toast({
          title: "Could not start payment",
          description: data.error ?? "Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }

      window.location.href = data.authorization_url as string;
    } catch (error) {
      console.error(error);
      toast({
        title: "Unexpected error",
        description: "Something went wrong starting the payment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Enrollment & Payments"
        description="Secure payment step for enrolling a child into the AI Innovators Program."
        canonical={`${window.location.origin}/payments`}
      />
      <MainNavbar />
      <main className="container pb-24 pt-10">
        <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Enroll a child into the AI Innovators Program
          </h1>
          <p className="text-sm text-muted-foreground">
            Use this secure payment step to start your child&apos;s journey. After payment, you&apos;ll be guided to create their
            dashboard profile.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground line-through">NGN 50,000</span>
            <span className="font-semibold text-primary">NGN 30,000</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              First 25 students only
            </span>
          </div>

          <form onSubmit={handleStartPayment} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="payment-email">
                Parent / guardian email
              </label>
              <Input
                id="payment-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <p className="text-[11px] text-muted-foreground">
                We&apos;ll send your receipt and login details here.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="child-name">
                  Child&apos;s name
                </label>
                <Input
                  id="child-name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Amina Okafor"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="child-age">
                  Child&apos;s age
                </label>
                <Input id="child-age" value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="12" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="child-class">
                Child&apos;s class
              </label>
              <Input
                id="child-class"
                value={childClass}
                onChange={(e) => setChildClass(e.target.value)}
                placeholder="JSS 2"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Enrollment fee</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  NGN {ENROLLMENT_AMOUNT_NGN.toLocaleString()}
                </p>
              </div>
              <p className="max-w-[55%] text-[11px]">
                Covers program access, dashboards for parents &amp; schools, and project tracking.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="parent"
              disabled={loading}
              className="mt-1 w-full interactive-button button-glow"
            >
              {loading ? "Redirecting to Paystack..." : "Pay with Paystack"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default PaymentsPage;
