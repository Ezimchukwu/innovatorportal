// Edge function: Initialize Paystack transaction for enrollment payments with auth
// This runs on the backend and uses the PAYSTACK_SECRET_KEY secret.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

if (!PAYSTACK_SECRET_KEY) {
  console.error("PAYSTACK_SECRET_KEY is not set in environment variables");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Payment configuration missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer", "").trim() : "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      },
    });

    let userId: string | undefined;
    if (accessToken) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("paystack-init: unable to resolve signed-in user", userError);
      } else if (user) {
        userId = user.id;
      }
    }

    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const amount = Number(body.amount ?? 0); // amount in kobo
    const metadata = body.metadata ?? {};

    if (!email || !email.includes("@") || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid email or amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const callbackUrl = body.callback_url as string | undefined;

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        callback_url: callbackUrl,
        metadata: {
          source: "ai-innovators-portal",
          purpose: "child_enrollment",
          user_id: userId ?? null,
          child_name: metadata.child_name ?? "",
          child_age: metadata.child_age ?? "",
          child_class: metadata.child_class ?? "",
          parent_email: email,
          guest_checkout: !userId,
        },
      }),
    });

    const initJson = await initRes.json();

    if (!initRes.ok || !initJson.status) {
      console.error("Paystack initialize error", initJson);
      return new Response(JSON.stringify({ error: "Unable to start payment, please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        authorization_url: initJson.data.authorization_url,
        reference: initJson.data.reference,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    console.error("Unexpected error in paystack-init", error);
    return new Response(JSON.stringify({ error: "Unexpected error starting payment." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
