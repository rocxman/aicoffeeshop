-- ============================================
-- AI COFFEE SHOP PLATFORM - SUPABASE MIGRATION
-- ============================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- Compatible with Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE ENUMS (Drop if exists first)
-- ============================================

-- Drop enums if they exist (for re-run safety)
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

-- Create enums
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'STAFF', 'MANAGER');
CREATE TYPE "Channel" AS ENUM ('WHATSAPP', 'QR', 'WEB', 'VOICE', 'MOBILE_APP');
CREATE TYPE "OptionType" AS ENUM ('SINGLE', 'MULTIPLE');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'DEBIT_CARD', 'CREDIT_CARD', 'E_WALLET', 'BANK_TRANSFER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "PromoType" AS ENUM ('DISCOUNT', 'BUNDLE', 'BOGO');
CREATE TYPE "ValueType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT');
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');

-- ============================================
-- USER & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  role "Role" NOT NULL DEFAULT 'CUSTOMER',
  "avatarUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "User_phone_idx" ON "User"(phone);
CREATE INDEX "User_email_idx" ON "User"(email);
CREATE INDEX "User_role_idx" ON "User"(role);

-- ============================================
-- SESSION MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "Session" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  channel "Channel" NOT NULL,
  context JSONB,
  metadata JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastActiveAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_channel_idx" ON "Session"(channel);
CREATE INDEX "Session_isActive_idx" ON "Session"("isActive");

-- ============================================
-- MENU SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "MenuCategory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "MenuCategory_isActive_idx" ON "MenuCategory"("isActive");
CREATE INDEX "MenuCategory_sortOrder_idx" ON "MenuCategory"("sortOrder");

CREATE TABLE IF NOT EXISTS "MenuItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "categoryId" UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  images TEXT[] DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "prepTime" INTEGER,
  calories INTEGER,
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "MenuItem_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"(id)
);

CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");
CREATE INDEX "MenuItem_isActive_idx" ON "MenuItem"("isActive");
CREATE INDEX "MenuItem_isPopular_idx" ON "MenuItem"("isPopular");
CREATE INDEX "MenuItem_price_idx" ON "MenuItem"(price);

CREATE TABLE IF NOT EXISTS "MenuOption" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "itemId" UUID NOT NULL,
  name TEXT NOT NULL,
  type "OptionType" NOT NULL DEFAULT 'SINGLE',
  required BOOLEAN NOT NULL DEFAULT false,
  "minSelect" INTEGER NOT NULL DEFAULT 0,
  "maxSelect" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "MenuOption_itemId_fkey" 
    FOREIGN KEY ("itemId") REFERENCES "MenuItem"(id) ON DELETE CASCADE
);

CREATE INDEX "MenuOption_itemId_idx" ON "MenuOption"("itemId");

CREATE TABLE IF NOT EXISTS "MenuOptionValue" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "optionId" UUID NOT NULL,
  value TEXT NOT NULL,
  "priceModifier" INTEGER NOT NULL DEFAULT 0,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "MenuOptionValue_optionId_fkey" 
    FOREIGN KEY ("optionId") REFERENCES "MenuOption"(id) ON DELETE CASCADE
);

CREATE INDEX "MenuOptionValue_optionId_idx" ON "MenuOptionValue"("optionId");
CREATE INDEX "MenuOptionValue_isActive_idx" ON "MenuOptionValue"("isActive");

-- ============================================
-- ORDER MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "orderNumber" TEXT NOT NULL UNIQUE,
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  channel "Channel" NOT NULL,
  "tableNumber" TEXT,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "customerNotes" TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  "serviceFee" INTEGER NOT NULL DEFAULT 0,
  "totalPrice" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  "paidAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "promoId" UUID,
  
  CONSTRAINT "Order_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"(id),
  CONSTRAINT "Order_tableNumber_fkey" 
    FOREIGN KEY ("tableNumber") REFERENCES "Table"(number)
);

CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"(status);
CREATE INDEX "Order_channel_idx" ON "Order"(channel);
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

CREATE TABLE IF NOT EXISTS "OrderItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL,
  "itemId" UUID NOT NULL,
  quantity INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "totalPrice" INTEGER NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "OrderItem_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE,
  CONSTRAINT "OrderItem_itemId_fkey" 
    FOREIGN KEY ("itemId") REFERENCES "MenuItem"(id)
);

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_itemId_idx" ON "OrderItem"("itemId");

CREATE TABLE IF NOT EXISTS "OrderItemOption" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderItemId" UUID NOT NULL,
  "optionValueId" UUID NOT NULL,
  "priceModifier" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "OrderItemOption_orderItemId_fkey" 
    FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"(id) ON DELETE CASCADE,
  CONSTRAINT "OrderItemOption_optionValueId_fkey" 
    FOREIGN KEY ("optionValueId") REFERENCES "MenuOptionValue"(id)
);

CREATE INDEX "OrderItemOption_orderItemId_idx" ON "OrderItemOption"("orderItemId");
CREATE INDEX "OrderItemOption_optionValueId_idx" ON "OrderItemOption"("optionValueId");

-- ============================================
-- PAYMENT SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "Payment" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL UNIQUE,
  "userId" UUID,
  method "PaymentMethod" NOT NULL,
  status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  amount INTEGER NOT NULL,
  "paidAmount" INTEGER NOT NULL DEFAULT 0,
  "refundAmount" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  "provider" TEXT,
  "providerId" TEXT,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "Payment_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"(id),
  CONSTRAINT "Payment_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"(id)
);

CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"(status);
CREATE INDEX "Payment_method_idx" ON "Payment"(method);

-- ============================================
-- PROMO & LOYALTY
-- ============================================

CREATE TABLE IF NOT EXISTS "Promo" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type "PromoType" NOT NULL,
  "valueType" "ValueType" NOT NULL,
  value INTEGER NOT NULL,
  "minPurchase" INTEGER NOT NULL DEFAULT 0,
  "maxDiscount" INTEGER,
  "usageLimit" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "perUserLimit" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMP NOT NULL,
  "validUntil" TIMESTAMP NOT NULL,
  "applicableItems" TEXT[] DEFAULT '{}',
  "applicableChannels" "Channel"[] DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "Promo_code_idx" ON "Promo"(code);
CREATE INDEX "Promo_isActive_idx" ON "Promo"("isActive");
CREATE INDEX "Promo_validFrom_idx" ON "Promo"("validFrom");
CREATE INDEX "Promo_validUntil_idx" ON "Promo"("validUntil");

CREATE TABLE IF NOT EXISTS "LoyaltyPoint" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
  tier "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "LoyaltyPoint_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX "LoyaltyPoint_userId_idx" ON "LoyaltyPoint"("userId");
CREATE INDEX "LoyaltyPoint_tier_idx" ON "LoyaltyPoint"(tier);

CREATE TABLE IF NOT EXISTS "LoyaltyTransaction" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "loyaltyPointId" UUID NOT NULL,
  type "LoyaltyTransactionType" NOT NULL,
  points INTEGER NOT NULL,
  "orderId" TEXT,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "LoyaltyTransaction_loyaltyPointId_fkey" 
    FOREIGN KEY ("loyaltyPointId") REFERENCES "LoyaltyPoint"(id) ON DELETE CASCADE
);

CREATE INDEX "LoyaltyTransaction_loyaltyPointId_idx" ON "LoyaltyTransaction"("loyaltyPointId");
CREATE INDEX "LoyaltyTransaction_type_idx" ON "LoyaltyTransaction"(type);

-- ============================================
-- TABLE MANAGEMENT (QR Ordering)
-- ============================================

CREATE TABLE IF NOT EXISTS "Table" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  "qrCodePath" TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  zone TEXT,
  status "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "Table_number_idx" ON "Table"(number);
CREATE INDEX "Table_status_idx" ON "Table"(status);
CREATE INDEX "Table_zone_idx" ON "Table"(zone);

CREATE TABLE IF NOT EXISTS "QRScan" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tableId" UUID NOT NULL,
  "sessionId" TEXT,
  "userId" TEXT,
  "deviceType" TEXT,
  browser TEXT,
  "ipAddress" TEXT,
  "scannedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  converted BOOLEAN NOT NULL DEFAULT false,
  "orderId" TEXT,
  
  CONSTRAINT "QRScan_tableId_fkey" 
    FOREIGN KEY ("tableId") REFERENCES "Table"(id) ON DELETE CASCADE
);

CREATE INDEX "QRScan_tableId_idx" ON "QRScan"("tableId");
CREATE INDEX "QRScan_scannedAt_idx" ON "QRScan"("scannedAt");
CREATE INDEX "QRScan_sessionId_idx" ON "QRScan"("sessionId");

-- ============================================
-- SYSTEM & AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT,
  "userId" TEXT,
  metadata JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuditLog_action_idx" ON "AuditLog"(action);
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"(entity);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE IF NOT EXISTS "SystemSetting" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"(category);

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all created tables
SELECT 
  '✅ Migration completed successfully!' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
