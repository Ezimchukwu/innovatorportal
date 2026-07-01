# Vercel Deployment Quick Start Guide

## Prerequisites
- Vercel account with project linked
- Paystack secret key (sk_live_...)
- Git repository connected to Vercel

---

## Step 1: Add Environment Variables to Vercel

### Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Name: PAYSTACK_SECRET_KEY
   Value: sk_live_your_actual_secret_key
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```
5. Click **Add**
6. Redeploy to apply changes

### Via Vercel CLI
```bash
# Set for all environments
vercel env add PAYSTACK_SECRET_KEY
# Paste: sk_live_your_actual_secret_key

# Verify
vercel env list
```

---

## Step 2: Deploy to Vercel

### Option A: Using Git (Recommended)
```bash
# Commit all changes
git add .
git commit -m "feat: migrate payment processing from Supabase to Vercel"
git push origin main

# Vercel automatically deploys
# Watch deployment: https://vercel.com/dashboard/your-project
```

### Option B: Using Vercel CLI
```bash
# Deploy to production
vercel deploy --prod

# Output will show:
# ✓ Deployed to https://your-domain.vercel.app
```

---

## Step 3: Verify Deployment

### Check Function Status
```bash
# View all deployments
vercel ls

# View function logs
vercel logs
```

### Test Endpoints
```bash
# Initialize payment
curl -X POST https://your-domain.vercel.app/api/paystack/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 3000000,
    "callback_url": "https://your-domain.vercel.app/payments/success",
    "metadata": {
      "child_name": "Test",
      "child_age": "8",
      "child_class": "Grade 3"
    }
  }'

# Should return authorization_url and reference
```

### Test in Browser
1. Navigate to `https://your-domain.vercel.app/payments`
2. Fill in enrollment form
3. Click "Pay" button
4. Should redirect to Paystack checkout
5. Use test card: 4111 1111 1111 1111 (with any future expiry)
6. Complete payment
7. Should return to `/payments/success`
8. Should show payment confirmation

---

## Step 4: Monitor Logs

### Real-time Logs
```bash
vercel logs --follow
```

### View Specific Function
```bash
vercel logs /api/paystack/initialize
vercel logs /api/paystack/verify
```

### Troubleshooting
If you see errors:
1. Check PAYSTACK_SECRET_KEY is set: `vercel env list`
2. Check function syntax: `vercel logs --follow`
3. Check browser console for frontend errors
4. Check Network tab for API responses

---

## Important Security Reminders

✅ **DO**:
- Keep PAYSTACK_SECRET_KEY in Vercel Environment Variables
- Use different keys for development/production
- Rotate keys periodically
- Monitor API usage for unusual activity
- Keep all code reviewed before deployment

❌ **DON'T**:
- Add PAYSTACK_SECRET_KEY to `.env` files
- Commit secrets to Git
- Share secret keys via email or chat
- Log secret keys to console
- Use same key across projects

---

## Troubleshooting

### Issue: "PAYSTACK_SECRET_KEY is not set"
**Solution**: 
1. Add variable in Vercel Settings
2. Redeploy: `vercel deploy --prod`
3. Wait 2-3 minutes for changes to take effect

### Issue: CORS errors in browser
**Solution**:
- Both API endpoints have proper CORS headers
- Check browser Network tab for exact error
- Review Vercel logs: `vercel logs`

### Issue: "Missing or Invalid Authorization Header"
**Solution**:
- Verify PAYSTACK_SECRET_KEY value is correct
- Check it starts with `sk_live_`
- Redeploy after adding/updating variable

### Issue: Payment verification fails
**Solution**:
1. Verify reference is in callback URL
2. Check Vercel logs for API errors
3. Test with `vercel dev` locally first
4. Verify Paystack account has correct secret key

---

## Local Development

### Setup Local Environment
```bash
# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull

# Creates .env.local with secrets
```

### Run Locally
```bash
# Start dev server with Vercel functions
vercel dev

# Runs on http://localhost:3000
# API functions available at /api/paystack/*
```

### Test Locally
```bash
# Visit http://localhost:3000/payments
# Complete test payment
# Verify success page
```

---

## Rollback

If issues occur:

```bash
# See deployment history
vercel ls

# Rollback to previous deployment
vercel rollback

# Or redeploy specific commit
git revert <commit-hash>
git push origin main

# Vercel automatically redeploys
```

---

## Performance Optimization

Current settings in `vercel.json`:
```json
{
  "functions": {
    "api/paystack/initialize.ts": {
      "memory": 1024,
      "maxDuration": 30
    },
    "api/paystack/verify.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

**Typical Performance**:
- Initialize: ~500ms
- Verify: ~400ms
- Cold start: <100ms
- Warm start: <50ms

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set PAYSTACK_SECRET_KEY in Environment Variables
3. ✅ Test payment flow on live domain
4. ✅ Monitor Vercel logs
5. ✅ Update team documentation
6. ✅ Archive old Supabase functions

---

## Helpful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api/)
- [Supabase Dashboard](https://app.supabase.com)

---

**Deployment Checklist**:
- [ ] PAYSTACK_SECRET_KEY added to Vercel
- [ ] Code merged to main branch
- [ ] Vercel deployment successful
- [ ] All endpoints responding
- [ ] Test payment completed successfully
- [ ] Payment record in Supabase database
- [ ] No errors in Vercel logs
- [ ] Team notified of deployment

**Ready to deploy!** 🚀
