# 📤 SUPABASE UPLOAD GUIDE

## 🎯 CARA UPLOAD SCHEMA KE SUPABASE

Ada **2 cara** untuk setup database di Supabase:

---

## ✅ **CARA 1: VIA SUPABASE DASHBOARD (Manual - Recommended)**

### **Step 1: Login ke Supabase**
1. Buka: https://supabase.com
2. Login dengan GitHub
3. Pilih project: `elkaieuzmsfxylrvzlgt`

### **Step 2: Buka SQL Editor**
1. Klik **"SQL Editor"** di sidebar kiri
2. Klik **"New Query"**

### **Step 3: Upload Migration SQL**
1. Buka file: `backend/supabase/migration.sql`
2. **Copy SEMUA isi file**
3. **Paste** di SQL Editor
4. Klik **"Run"** (atau Ctrl+Enter)

### **Step 4: Verify**
Jalankan query ini untuk cek:

```sql
-- Cek semua tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Harus ada 16 tables:
-- User, Session, MenuCategory, MenuItem, MenuOption, MenuOptionValue
-- Order, OrderItem, OrderItemOption, Payment
-- Promo, LoyaltyPoint, LoyaltyTransaction
-- Table, QRScan, AuditLog, SystemSetting
```

✅ **DONE!** Database siap dipakai.

---

## ⚙️ **CARA 2: VIA TERMINAL (Prisma CLI)**

### **Prerequisites:**
- Node.js installed
- Database connection working

### **Steps:**

```bash
# Navigate to backend folder
cd backend

# Generate Prisma Client
npx prisma generate

# Deploy migrations to Supabase
npx prisma migrate deploy

# (Optional) Seed database with sample data
npm run prisma:seed
```

---

## 📁 **FILE YANG HARUS DIUPLOAD**

### **Untuk Supabase Dashboard:**

| File | Lokasi | Cara Upload |
|------|--------|-------------|
| **migration.sql** | `backend/supabase/migration.sql` | Copy-paste ke SQL Editor |

### **TIDAK PERLU Upload:**
- ❌ `.env` file (jangan pernah upload!)
- ❌ `schema.prisma` (hanya untuk Prisma CLI)
- ❌ Seed files (optional, bisa run manual)

---

## 🔧 **SETELAH MIGRATION - SEED DATA (Optional)**

Jika ingin isi database dengan sample data:

### **Option A: Via Prisma CLI**
```bash
cd backend
npm run prisma:seed
```

### **Option B: Manual via SQL Editor**

Copy isi file `backend/prisma/seed.ts` dan convert ke SQL, atau run:

```sql
-- Insert sample data manually
-- (See prisma/seed.ts for reference)
```

---

## 🧪 **TEST KONEKSI DATABASE**

Setelah migration, test dengan query ini di SQL Editor:

```sql
-- Test 1: Count tables
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected: 16+ tables

-- Test 2: Check User table
SELECT id, email, name, role 
FROM "User" 
LIMIT 5;

-- Test 3: Check Menu Categories
SELECT id, name, icon 
FROM "MenuCategory" 
ORDER BY "sortOrder";

-- Test 4: Check Tables (QR)
SELECT number, code, zone, status 
FROM "Table" 
LIMIT 10;
```

---

## ⚠️ **TROUBLESHOOTING**

### **Error: "relation already exists"**

**Solusi:** Tables sudah ada. Drop semua tables dulu:

```sql
-- WARNING: Ini akan DELETE semua data!
DROP TABLE IF EXISTS "QRScan" CASCADE;
DROP TABLE IF EXISTS "LoyaltyTransaction" CASCADE;
DROP TABLE IF EXISTS "LoyaltyPoint" CASCADE;
DROP TABLE IF EXISTS "OrderItemOption" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Promo" CASCADE;
DROP TABLE IF EXISTS "MenuOptionValue" CASCADE;
DROP TABLE IF EXISTS "MenuOption" CASCADE;
DROP TABLE IF EXISTS "MenuItem" CASCADE;
DROP TABLE IF EXISTS "MenuCategory" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Table" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "SystemSetting" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "Channel" CASCADE;
DROP TYPE IF EXISTS "OptionType" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "PromoType" CASCADE;
DROP TYPE IF EXISTS "ValueType" CASCADE;
DROP TYPE IF EXISTS "LoyaltyTier" CASCADE;
DROP TYPE IF EXISTS "LoyaltyTransactionType" CASCADE;
DROP TYPE IF EXISTS "TableStatus" CASCADE;

-- Then run migration.sql again
```

### **Error: "permission denied"**

**Solusi:** Pastikan menggunakan connection string yang benar:
- Gunakan `DIRECT_URL` untuk migrations (port 5432)
- Bukan `DATABASE_URL` (pooler port 6543)

### **Error: "database does not exist"**

**Solusi:** 
1. Cek project Supabase aktif
2. Verify connection string di `.env`
3. Restart Supabase project

---

## 📊 **DATABASE SCHEMA OVERVIEW**

### **Tables Created (16 total):**

#### **User Management (2)**
- `User` - User accounts & authentication
- `Session` - AI conversation sessions

#### **Menu System (4)**
- `MenuCategory` - Category hierarchy
- `MenuItem` - Products
- `MenuOption` - Customizations (size, sugar)
- `MenuOptionValue` - Option values with pricing

#### **Order Management (3)**
- `Order` - Order headers
- `OrderItem` - Line items
- `OrderItemOption` - Item customizations

#### **Payment & Promo (3)**
- `Payment` - Payment transactions
- `Promo` - Discount campaigns
- `LoyaltyPoint` - Customer rewards
- `LoyaltyTransaction` - Points history

#### **QR System (2)**
- `Table` - Table management
- `QRScan` - Scan tracking & analytics

#### **System (2)**
- `AuditLog` - Activity logging
- `SystemSetting` - Configuration

---

## 🎯 **CHECKLIST SETELAH UPLOAD**

- [ ] Migration SQL executed successfully
- [ ] 16 tables created
- [ ] No errors in SQL Editor
- [ ] Test queries run successfully
- [ ] (Optional) Sample data seeded
- [ ] Database accessible from Railway

---

## 🔗 **NEXT STEPS**

1. ✅ Upload migration.sql ke Supabase
2. ✅ Verify tables created
3. ✅ Test connection dari Railway
4. ✅ Deploy backend ke Railway
5. ✅ Test API endpoints

---

## 📚 **ADDITIONAL RESOURCES**

- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://pris.ly/d
- SQL Editor: https://app.supabase.com/project/elkaieuzmsfxylrvzlgt/sql

---

**File Location:**
```
backend/
├── supabase/
│   └── migration.sql  ← UPLOAD INI KE SUPABASE
├── prisma/
│   ├── schema.prisma  ← For Prisma CLI
│   └── seed.ts        ← Sample data
└── RAILWAY_DEPLOYMENT.md
```

**Need Help?** Check troubleshooting section or Supabase logs.
