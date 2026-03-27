# ============================================
# DEPLOYMENT GUIDE - SUPABASE + RAILWAY
# ============================================

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Supabase Setup ✅
- [x] Project created: `elkaieuzmsfxylrvzlgt`
- [x] Connection strings configured
- [ ] Run migrations
- [ ] Seed data

### 2. Environment Variables
Update `.env` with your Supabase credentials.

## 🚀 DEPLOYMENT STEPS

### Step 1: Push Schema to Supabase

```bash
# Option A: Using direct connection (recommended for migrations)
cd backend
npx prisma db push --accept-data-loss

# Option B: Using migrations
npx prisma migrate deploy
```

### Step 2: Seed Database

```bash
npm run prisma:seed
```

### Step 3: Deploy to Railway

1. Push code to GitHub
2. Go to https://railway.app
3. Create new project → Deploy from GitHub
4. Select your repository
5. Add environment variables from `.env`
6. Deploy!

### Step 4: Verify Deployment

```bash
# Test health endpoint
curl https://your-railway-url.railway.app/api/health

# Test database connection
curl https://your-railway-url.railway.app/api/menu/items
```

## 🔧 TROUBLESHOOTING

### Connection Issues

If you get "Can't reach database server":

1. Check if Supabase project is active
2. Verify connection strings in `.env`
3. Make sure DIRECT_URL is used for migrations
4. Make sure DATABASE_URL is used for runtime

### Prisma Client Errors

Regenerate Prisma Client:

```bash
npx prisma generate
```

### Migration Errors

Reset and redeploy:

```bash
# WARNING: This will delete all data!
npx prisma migrate reset
```

## 📊 MONITORING

- Supabase Dashboard: https://app.supabase.com/project/elkaieuzmsfxylrvzlgt
- Railway Dashboard: https://railway.app/dashboard

## 🔐 SECURITY NOTES

⚠️ IMPORTANT:
- Never commit `.env` file
- Rotate keys after deployment
- Use environment-specific secrets
- Enable SSL in production
