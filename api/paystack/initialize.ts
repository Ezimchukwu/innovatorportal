import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function: Initialize Paystack Transaction
 * Replaces: supabase/functions/paystack-init/index.ts
 * 
 * This function handles payment initialization for child enrollment.
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
    const { email, amount, callback_url, metadata } = req.body;

    // Validate input
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Call Paystack API to initialize transaction
    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        callback_url: callback_url || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/payments/success`,
        metadata: {
          source: 'ai-innovators-portal',
          purpose: 'child_enrollment',
          child_name: metadata?.child_name ?? '',
          child_age: metadata?.child_age ?? '',
          child_class: metadata?.child_class ?? '',
          parent_email: email,
          guest_checkout: true,
          created_at: new Date().toISOString(),
        },
      }),
    });

    const initJson = await initRes.json();

    if (!initRes.ok || !initJson.status || !initJson.data?.authorization_url) {
      console.error('Paystack initialize error:', initJson);
      res.status(500).json({ error: 'Unable to start payment. Please try again.' });
      return;
    }

    // Return success response
    res.status(200).json({
      success: true,
      authorization_url: initJson.data.authorization_url,
      reference: initJson.data.reference,
      access_code: initJson.data.access_code,
    });
  } catch (error) {
    console.error('Unexpected error in paystack-initialize:', error);
    res.status(500).json({
      error: 'Unexpected error starting payment. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
