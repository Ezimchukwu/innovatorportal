# Environment Variables Guide

## Overview
This guide explains all environment variables used in the AI Innovators Portal, with emphasis on security best practices for payment processing.

---

## Frontend Environment Variables (Safe to Expose)

These variables are prefixed with `VITE_` and are bundled into the frontend code. They are public and safe to expose.

### VITE_SUPABASE_PROJECT_ID
```
Value: your_project_id
Purpose: Unique identifier for Supabase project
Visibility: Public (embedded in frontend)
Security: Low - Used to identify your Supabase instance
Where to set: .env, .env.local, Vercel Environment Variables
```

### VITE_SUPABASE_PUBLISHABLE_KEY
```
Value: your_publishable_key_here
Purpose: Public key for Supabase client authentication
Visibility: Public (embedded in frontend)
Security: Medium - Only allows public operations per RLS policies
Where to set: .env, .env.local, Vercel Environment Variables
Role: Read-only for public data, authenticated for user data
```

### VITE_SUPABASE_URL
```
Value: https://your-project.supabase.co
Purpose: Endpoint URL for Supabase database
Visibility: Public (used by frontend)
Security: Low - Just the domain, no credentials
Where to set: .env, .env.local, Vercel Environment Variables
```

---

## Server-Side Environment Variables (NEVER Expose)

These variables are used only on the server (Vercel serverless functions) and should NEVER be exposed to the frontend.

### PAYSTACK_SECRET_KEY ⚠️ CRITICAL
```
Purpose: Authentication with Paystack API (server-side)
Visibility: PRIVATE - Server-side only
Security: CRITICAL - Grants full payment processing access
Where to set: ONLY Vercel Environment Variables (NOT in .env)
What it allows: 
  - Initialize payment transactions
  - Verify payments
  - Refund transactions
  - Access payment history
  - Access customer data

✅ DO:
- Set in Vercel Dashboard → Settings → Environment Variables
- Use different keys for staging/production
- Rotate periodically
- Monitor usage for suspicious activity

❌ DON'T:
- Add to .env or .env.local files
- Commit to Git
- Share via email or chat
- Log to console
- Use in frontend code
```

---

## Environment Variable Configuration Files

### .env (Development)
```
# Purpose: Local development configuration
# Visibility: Local machine only
# Commit to Git: NO - Add to .gitignore
# Content: Frontend variables only (VITE_*)

VITE_SUPABASE_PROJECT_ID="hvmvauvsjwumjiqzxabc"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://hvmvauvsjwumjiqzxabc.supabase.co"
# CRITICAL: PAYSTACK_SECRET_KEY is now set only in Vercel environment variables
# DO NOT expose PAYSTACK_SECRET_KEY in the frontend or .env file
```

### .env.local (Local Development with Vercel Functions)
```
# Purpose: Local development with Vercel serverless functions
# Visibility: Local machine only
# Commit to Git: NO - Add to .gitignore
# When to use: When testing Vercel functions locally with 'vercel dev'
# How to create: vercel env pull (pulls from Vercel)

# Copy contents from Vercel, or from .env.example
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
PAYSTACK_SECRET_KEY="your_secret_key"  # Optional: for local testing only
```

### .env.example (Template)
```
# Purpose: Template for developers
# Visibility: Public - Safe to commit
# Commit to Git: YES
# Usage: Copy to .env.local and fill in real values

VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
# PAYSTACK_SECRET_KEY should NEVER be in this file
```

### Vercel Environment Variables (Production)
```
# Purpose: Production deployment configuration
# Location: Vercel Dashboard → Settings → Environment Variables
# Commit to Git: NO - Managed by Vercel
# How to set: Via dashboard UI or 'vercel env add' CLI

PAYSTACK_SECRET_KEY=your_secret_key
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

## Setting Environment Variables

### Development Setup

1. **Using .env file**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with real values
   npm run dev
   ```

2. **Using Vercel CLI** (for Vercel function testing):
   ```bash
   vercel link              # Link to Vercel project
   vercel env pull          # Pull environment variables
   vercel dev               # Run with Vercel functions
   ```

### Production Setup

1. **Via Vercel Dashboard**:
   - Go to Project Settings
   - Click Environment Variables
   - Add PAYSTACK_SECRET_KEY
   - Set for Production environment
   - Save and redeploy

2. **Via Vercel CLI**:
   ```bash
   vercel env add PAYSTACK_SECRET_KEY
   # Paste: your_secret_key_here
   vercel deploy --prod
   ```

---

## Security Best Practices

### ✅ DO:
1. **Keep secrets secure**
   ```bash
   # Good: Use Vercel Environment Variables
   PAYSTACK_SECRET_KEY is set in Vercel dashboard only
   ```

2. **Use different keys per environment**
   ```bash
   # Production: your_production_key
   # Staging: your_staging_key
   # Development: your_development_key
   ```

3. **Rotate keys periodically**
   - Every 90 days recommended
   - Immediately after suspected compromise
   - When team member leaves

4. **Monitor API usage**
   - Check Paystack dashboard for unusual activity
   - Set up alerts for failed payments
   - Track transaction volumes

5. **Audit access logs**
   - Review Vercel function logs
   - Check Paystack API logs
   - Monitor authentication failures

### ❌ DON'T:
1. **Store secrets in version control**
   ```bash
   # Bad: Commit to Git
   git add .env
   
   # Good: Add to .gitignore
   echo ".env.local" >> .gitignore
   echo ".env" >> .gitignore
   ```

2. **Expose secrets in logs**
   ```bash
   // Bad: Logging secrets
   console.log("PAYSTACK_SECRET_KEY:", PAYSTACK_SECRET_KEY);
   
   // Good: Only log non-sensitive info
   console.log("Payment initialized for:", email);
   ```

3. **Use same key across projects**
   ```bash
   # Bad: One key for all projects
   PAYSTACK_SECRET_KEY=one_key_for_everything
   
   # Good: Unique key per project
   # Portal: portal_key
   # Dashboard: dashboard_key
   ```

4. **Share secrets via insecure channels**
   ```bash
   # Bad: Email, Slack, etc.
   # Never share secrets via unsecure channels
   
   # Good: Use secure secret management
   # Share via 1Password, LastPass, Vercel dashboard invite
   ```

---

## Verifying Environment Variables

### Check Vercel Variables
```bash
# List all environment variables
vercel env list

# Output:
# Production
#   PAYSTACK_SECRET_KEY ••••••••
#   VITE_SUPABASE_URL ...

# Preview
#   PAYSTACK_SECRET_KEY ••••••••
#   VITE_SUPABASE_URL ...
```

### Check Local Variables
```bash
# List loaded .env variables
env | grep VITE

# Should show:
# VITE_SUPABASE_PROJECT_ID=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# VITE_SUPABASE_URL=...
```

### Verify Variables are Loaded in Code
```typescript
// Frontend - OK to log
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

// Backend - NEVER log
console.log("Paystack Key:", process.env.PAYSTACK_SECRET_KEY); // ❌ DON'T DO THIS
console.log("Paystack Key:", process.env.PAYSTACK_SECRET_KEY ? "SET" : "NOT SET"); // ✅ OK
```

---

## Troubleshooting

### Issue: "PAYSTACK_SECRET_KEY is not defined"
**Cause**: Variable not set in Vercel
**Solution**:
1. Go to Vercel Dashboard
2. Select Project
3. Settings → Environment Variables
4. Add PAYSTACK_SECRET_KEY
5. Set for Production and Preview
6. Redeploy: `vercel deploy --prod`

### Issue: "Cannot find module or Supabase initialization error"
**Cause**: VITE_SUPABASE_* variables missing
**Solution**:
1. Verify .env has all VITE_ variables
2. Check spelling matches exactly
3. Restart dev server
4. Verify Vercel has variables set

### Issue: "Access-Control-Allow-Origin"
**Cause**: CORS issue with API endpoints
**Solution**:
1. Both endpoints have CORS headers
2. Check browser Network tab
3. Review Vercel logs
4. Verify endpoint URLs are correct

---

## Variable Reference Table

| Variable Name | Type | Visibility | Location | Required | Purpose |
|---|---|---|---|---|---|
| VITE_SUPABASE_PROJECT_ID | String | Public | .env, Vercel | Yes | Supabase project ID |
| VITE_SUPABASE_PUBLISHABLE_KEY | String | Public | .env, Vercel | Yes | Supabase auth key |
| VITE_SUPABASE_URL | String | Public | .env, Vercel | Yes | Supabase database URL |
| PAYSTACK_SECRET_KEY | String | Private | Vercel Only | Yes | Paystack API secret |

---

## Checklist

- [ ] PAYSTACK_SECRET_KEY is set in Vercel (NOT in .env)
- [ ] All VITE_* variables are set correctly
- [ ] .env is NOT committed to Git
- [ ] .env.local is NOT committed to Git
- [ ] .env.example is committed (template only)
- [ ] PAYSTACK_SECRET_KEY is NOT in .env history
- [ ] Production and Preview environments have correct keys
- [ ] Local development works with vercel dev
- [ ] All tests pass with environment variables
- [ ] Team members know not to commit secrets

---

## Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Paystack API Documentation](https://paystack.com/docs/api)
- [Node.js Best Practices for Secrets](https://nodejs.org/en/knowledge/file-system/security/introduction/)

---

**Last Updated**: 2026-07-01
**Status**: ✅ Complete
**Security Level**: High
