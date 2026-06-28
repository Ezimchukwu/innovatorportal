import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/MainNavbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface VerifyResult {
  status: string;
  amount: number;
  currency: string;
  reference: string;
  paid_at: string | null;
  gateway_response: string | null;
  raw: unknown;
}

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  useEffect(() => {
    const run = async () => {
      if (!reference) {
        setError("Missing payment reference in the callback URL.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: verifyError } = await supabase.functions.invoke<VerifyResult>(
          "paystack-verify",
          {
            body: { reference },
          },
        );

        if (verifyError) {
          console.error(verifyError);
          setError("We could not verify this payment. Please contact support.");
          return;
        }

        if (!data) {
          setError("No payment details were returned.");
          return;
        }

        setVerifyResult(data);

        const rawPayload = (data.raw as { metadata?: Record<string, unknown> } | undefined) ?? {};
        const childName = typeof rawPayload.metadata?.child_name === "string" ? rawPayload.metadata.child_name : "";
        const childAge = typeof rawPayload.metadata?.child_age === "string" ? rawPayload.metadata.child_age : "";
        const childClass = typeof rawPayload.metadata?.child_class === "string" ? rawPayload.metadata.child_class : "";
        const parentEmail = typeof rawPayload.metadata?.parent_email === "string" ? rawPayload.metadata.parent_email : "";

        const { data: existing } = await supabase
          .from("payments")
          .select("id, status")
          .eq("provider_reference", data.reference)
          .maybeSingle();

        if (!existing) {
          const amountNaira = Math.round((data.amount ?? 0) / 100);
          const paymentUserId = user?.id ?? crypto.randomUUID();

          const { error: insertError } = await supabase.from("payments").insert({
            user_id: paymentUserId,
            amount: amountNaira,
            currency: data.currency ?? "NGN",
            provider: "paystack",
            provider_reference: data.reference,
            status: data.status === "success" ? "verified" : "failed",
            metadata: {
              ...(data.raw as Record<string, unknown>),
              child_name: childName,
              child_age: childAge,
              child_class: childClass,
              parent_email: parentEmail,
            },
          });

          if (insertError) {
            console.error("Error saving payment record", insertError);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while confirming your payment.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [reference, user]);

  const isSuccess = verifyResult?.status === "success";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Payment complete"
        description="Enrollment payment confirmation for the AI Innovators Program."
        canonical={`${window.location.origin}/payments/success`}
      />
      <MainNavbar />
      <main className="container pb-24 pt-10">
        <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-primary/15 bg-card p-6 text-sm shadow-[var(--shadow-soft)]">
          {loading && (
            <p className="text-center text-muted-foreground">Confirming your payment, please wait...</p>
          )}

          {!loading && error && (
            <div className="space-y-3">
              <h1 className="text-center text-lg font-semibold tracking-tight">We couldn&apos;t confirm this payment</h1>
              <p className="text-center text-xs text-muted-foreground">{error}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  size="sm"
                  className="hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)]"
                  onClick={() => navigate("/payments")}
                >
                  Try payment again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/" )}
                >
                  Go back home
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && verifyResult && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Enrollment payment {isSuccess ? "confirmed" : "recorded"}
                </p>
                <h1 className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">
                  {isSuccess ? "Thank you for enrolling a child" : "We&apos;ve logged your payment attempt"}
                </h1>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isSuccess
                    ? "Your transaction was successful. Next, you can create your child&apos;s profile so their projects and certificates are tracked correctly."
                    : "This payment did not complete successfully. You can try again, or contact support with the reference below."}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Payment details
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {verifyResult.currency} {Math.round((verifyResult.amount ?? 0) / 100).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isSuccess
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {verifyResult.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Reference</dt>
                    <dd className="font-mono text-foreground/90 break-all">{verifyResult.reference}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Gateway response</dt>
                    <dd className="text-foreground/90">{verifyResult.gateway_response ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Paid at</dt>
                    <dd className="text-foreground/90">{verifyResult.paid_at ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  size="sm"
                  className="w-full hover-scale bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-soft)] sm:w-auto"
                  asChild
                >
                  <Link to="/parent">Go to Parent Dashboard</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link to="/">Explore projects</Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;
