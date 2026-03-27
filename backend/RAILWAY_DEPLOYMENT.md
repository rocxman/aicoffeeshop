# 🚀 RAILWAY DEPLOYMENT GUIDE

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. GitHub Repository ✅
- [x] Code pushed to: https://github.com/rocxman/aicoffeeshop
- [x] .gitignore configured (`.env` excluded)
- [x] `package.json` updated with Prisma generation

### 2. Database (Supabase) ✅
- [x] Project: `elkaieuzmsfxylrvzlgt`
- [x] Connection strings ready
- [ ] Migration deployed

### 3. Package.json Updates ✅
- [x] `build` script: `prisma generate && nest build`
- [x] `postinstall` script: `prisma generate`

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Login to Railway

1. Go to https://railway.app
2. Click **"Login"** → **"Sign in with GitHub"**
3. Authorize Railway

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: `rocxman/aicoffeeshop`
4. Click **"Deploy Now"**

### Step 3: Configure Environment Variables

In Railway Dashboard:
1. Click on your project
2. Go to **"Variables"** tab
3. Click **"New Variable"** → **"Raw Editor"**
4. Paste ALL variables from `.env`:

```env
# ============================================
# DATABASE - SUPABASE
# ============================================
DATABASE_URL="postgresql://postgres.elkaieuzmsfxylrvzlgt:MANDAwildi14@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.elkaieuzmsfxylrvzlgt:MANDAwildi14@db.elkaieuzmsfxylrvzlgt.supabase.com:5432/postgres"

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL="https://elkaieuzmsfxylrvzlgt.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_3U5jf2QU87OaRHUlnDtX3g_didDrM0n"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_0EZdA3jWkYWIfPc-DMyOgA_f7keMVos"

# ============================================
# APPLICATION
# ============================================
PORT=3000
NODE_ENV=production
FRONTEND_URL="https://your-railway-url.railway.app"

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET="CHANGE_THIS_TO_RANDOM_SECURE_STRING_32chars_minimum"
JWT_EXPIRATION="7d"
JWT_REFRESH_SECRET="CHANGE_THIS_TO_ANOTHER_RANDOM_SECURE_STRING"
JWT_REFRESH_EXPIRATION="30d"

# ============================================
# AI / LLM CONFIGURATION
# ============================================
OPENAI_API_KEY="sk-your-openai-api-key-here"
OPENAI_MODEL="gpt-4o-mini"
AI_TEMPERATURE="0.7"
AI_MAX_TOKENS="500"

# ============================================
# WHATSAPP BUSINESS API (Optional - Setup Later)
# ============================================
WHATSAPP_ENABLED=false
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_ID=""
WHATSAPP_BUSINESS_ID=""
WHATSAPP_WEBHOOK_VERIFY_TOKEN=""
WHATSAPP_API_VERSION="v18.0"
WHATSAPP_BASE_URL="https://graph.facebook.com"

# ============================================
# PAYMENT GATEWAY - MIDTRANS (Optional - Setup Later)
# ============================================
MIDTRANS_ENABLED=false
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION=false

# ============================================
# REDIS (Optional - For Caching)
# ============================================
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# ============================================
# MONITORING & LOGGING
# ============================================
SENTRY_DSN=""
LOG_LEVEL="info"
```

### Step 4: Update Critical Variables

**⚠️ IMPORTANT - Change These:**

1. **JWT_SECRET**: Generate random string
   ```bash
   # Run this in terminal
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and replace `JWT_SECRET` value

2. **JWT_REFRESH_SECRET**: Generate another random string

3. **FRONTEND_URL**: Update with your Railway URL after deployment

### Step 5: Deploy

1. Railway will automatically start building
2. Wait for build to complete (~3-5 minutes)
3. You'll see:
   - ✅ Build successful
   - 🌐 Public URL (e.g., `https://aicoffeeshop-production.up.railway.app`)

### Step 6: Run Database Migrations

After deployment:

1. Go to Railway Dashboard → Your Project
2. Click **"Settings"**
3. Scroll to **"Danger Zone"**
4. Click **"New Shell"** (or use Railway CLI)
5. Run commands:

```bash
# Deploy Prisma migrations
npx prisma migrate deploy

# Seed database (optional - for sample data)
npm run prisma:seed
```

### Step 7: Verify Deployment

Test your endpoints:

```bash
# Replace with your Railway URL
BASE_URL="https://your-railway-url.railway.app"

# Health check
curl $BASE_URL/api/health

# Get menu items
curl $BASE_URL/api/menu/items

# Test AI chat
curl -X POST $BASE_URL/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Halo","sessionId":"test-123","channel":"WEB"}'
```

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### 1. Update Supabase Settings

Go to: https://app.supabase.com/project/elkaieuzmsfxylrvzlgt

**Authentication > URL Configuration:**
- Add your Railway URL to:
  - Site URL: `https://your-railway-url.railway.app`
  - Redirect URLs: `https://your-railway-url.railway.app/**`

### 2. Update Midtrans Settings (if using)

Go to: https://dashboard.midtrans.com

**Settings > Payment:**
- Finish Redirect URL: `https://your-railway-url.railway.app/payment/success`
- Error Redirect URL: `https://your-railway-url.railway.app/payment/error`
- Payment Notification URL: `https://your-railway-url.railway.app/payment/webhook`

### 3. Setup WhatsApp Webhook (if using)

In Railway Dashboard:
1. Go to **"Settings"**
2. Copy your public URL
3. Add `/whatsapp/webhook` to get: `https://your-railway-url.railway.app/whatsapp/webhook`
4. Configure this URL in Meta Business Dashboard

---

## 🐛 TROUBLESHOOTING

### Build Fails

**Error: Prisma Client not generated**
```bash
# Solution: Check package.json has postinstall script
"postinstall": "prisma generate"
```

**Error: Database connection failed**
- Check `DATABASE_URL` and `DIRECT_URL` in Railway Variables
- Ensure Supabase project is active
- Verify credentials are correct (no extra spaces)

### Runtime Errors

**Error: Cannot reach database**
- Railway uses `DATABASE_URL` for runtime
- Make sure pooler URL is used (port 6543)
- Check `?pgbouncer=true` is in DATABASE_URL

**Error: JWT_SECRET not configured**
- Generate new secure random string
- Update in Railway Variables
- Redeploy

**Error: OpenAI API key invalid**
- Check API key is correct
- Ensure no quotes in value
- Verify account has credits

### Migration Issues

**Error: Can't connect to server**
```bash
# Use Railway Shell to run migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 📊 MONITORING

### Railway Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Build history

### Supabase Dashboard
- **Database**: Row counts, storage
- **Logs**: Query logs, errors
- **Auth**: User registrations

### Recommended Add-ons
- **Sentry**: Error tracking (free tier)
- **Uptime Robot**: Uptime monitoring (free)

---

## 🔐 SECURITY CHECKLIST

- [ ] JWT_SECRET changed to random secure string
- [ ] JWT_REFRESH_SECRET changed
- [ ] `.env` NOT committed to GitHub
- [ ] Database credentials rotated after deployment
- [ ] HTTPS enabled (automatic on Railway)
- [ ] CORS configured for production URL
- [ ] Rate limiting enabled

---

## 💰 COST ESTIMATION

### Railway Free Tier
- **500 hours/month** execution time
- **1 GB** storage
- **1 GB** bandwidth
- **Estimate:** 1-2 projects can run free

### Supabase Free Tier
- **500 MB** database
- **50,000** monthly active users
- **1 GB** file storage
- **Estimate:** Enough for MVP testing

### Total Monthly Cost: **$0** (Free tier)

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. ✅ Test all API endpoints
2. ✅ Verify database connection
3. ✅ Test AI chat functionality
4. ✅ Setup WhatsApp (optional)
5. ✅ Setup Payment (optional)
6. ✅ Build frontend dashboard
7. ✅ Deploy frontend to Vercel

---

## 📚 ADDITIONAL RESOURCES

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://pris.ly/d

---

**Need Help?**
- Check Railway logs for errors
- Review Supabase logs for database issues
- Create GitHub issue for bugs

**Deployment Status:** 🟡 Ready to Deploy
