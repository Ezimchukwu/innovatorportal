// Edge function: Initialize Paystack transaction for enrollment payments
// This runs on the backend and uses the PAYSTACK_SECRET_KEY secret.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

if (!PAYSTACK_SECRET_KEY) {
  console.error("PAYSTACK_SECRET_KEY is not set in environment variables");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Payment configuration missing" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const amount = Number(body.amount ?? 0); // amount in kobo

    if (!email || !email.includes("@") || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid email or amount" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const callbackUrl = body.callback_url as string | undefined;

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        callback_url: callbackUrl,
        metadata: {
          source: "ai-innovators-portal",
          purpose: "child_enrollment",
        },
      }),
    });

    const initJson = await initRes.json();

    if (!initRes.ok || !initJson.status) {
      console.error("Paystack initialize error", initJson);
      return new Response(JSON.stringify({ error: "Unable to start payment, please try again." }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(
      JSON.stringify({
        authorization_url: initJson.data.authorization_url,
        reference: initJson.data.reference,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected error in paystack-init", error);
    return new Response(JSON.stringify({ error: "Unexpected error starting payment." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
