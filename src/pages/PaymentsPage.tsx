import { MainNavbar } from "@/components/MainNavbar";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const ENROLLMENT_AMOUNT_NGN = 50000; // displayed amount
const ENROLLMENT_AMOUNT_KOBO = ENROLLMENT_AMOUNT_NGN * 100; // Paystack uses kobo

export const PaymentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [loading, setLoading] = useState(false);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Enter a valid email", description: "We need a valid parent email for the receipt.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            amount: ENROLLMENT_AMOUNT_KOBO,
            callback_url: `${window.location.origin}/payments/success`,
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

            <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Enrollment fee
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">NGN {ENROLLMENT_AMOUNT_NGN.toLocaleString()}</p>
              </div>
              <p className="max-w-[55%] text-[11px]">
                Covers program access, dashboards for parents &amp; schools, and project tracking.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-1 w-full hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
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
