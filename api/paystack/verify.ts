import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function: Verify Paystack Transaction
 * Replaces: supabase/functions/paystack-verify/index.ts
 * 
 * This function verifies completed Paystack transactions.
 * The PAYSTACK_SECRET_KEY is kept secure on the server side only.
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate that PAYSTACK_SECRET_KEY is set
  if (!PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY is not set in environment variables');
    res.status(500).json({ error: 'Payment configuration missing' });
    return;
  }

  try {
    const { reference } = req.body;

    // Validate reference
    if (!reference || typeof reference !== 'string' || reference.trim() === '') {
      res.status(400).json({ error: 'Missing or invalid payment reference' });
      return;
    }

    // Call Paystack API to verify transaction
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference.trim()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || !verifyJson.status || !verifyJson.data) {
      console.error('Paystack verify error:', verifyJson);
      res.status(500).json({ error: 'Unable to verify payment. Please contact support.' });
      return;
    }

    const data = verifyJson.data;

    // Return verification result
    res.status(200).json({
      success: true,
      status: data.status,
      amount: data.amount,
      currency: data.currency ?? 'NGN',
      reference: data.reference,
      paid_at: data.paid_at ?? null,
      gateway_response: data.gateway_response ?? null,
      authorization: data.authorization ?? null,
      customer: data.customer ?? null,
      metadata: data.metadata ?? null,
      raw: data,
    });
  } catch (error) {
    console.error('Unexpected error in paystack-verify:', error);
    res.status(500).json({
      error: 'Unexpected error verifying payment. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
