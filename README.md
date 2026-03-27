# ☕ AI Coffee Shop Assistant Platform

**Enterprise-Grade AI-Powered Ordering System for Modern Coffee Shops**

A complete omnichannel ordering platform with AI barista assistant, supporting WhatsApp, QR codes, and web chat.

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase recommended)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/aicoffeeshop.git
cd aicoffeeshop/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# Start development server
npm run start:dev
```

Server will run at: http://localhost:3000

---

## 📡 **API Endpoints**

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/login/phone` - Phone login

### Menu
- `GET /api/menu/categories` - Get categories
- `GET /api/menu/items` - Get menu items
- `POST /api/menu/items` - Create item (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update status (Staff)

### AI Chat
- `POST /api/ai/chat` - Chat with AI barista

### WhatsApp
- `POST /whatsapp/webhook` - WhatsApp webhook
- `POST /whatsapp/send` - Send message

### Payment
- `POST /payment/snap` - Create Snap payment
- `POST /payment/qris` - Create QRIS payment
- `POST /payment/webhook` - Payment webhook

### Tables (QR)
- `POST /tables` - Create table
- `POST /tables/scan` - Scan QR code
- `GET /tables/analytics/overview` - Analytics

---

## 🛠️ **Tech Stack**

- **Backend:** NestJS 11 + TypeScript
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma 7.5
- **AI:** OpenAI / OpenRouter
- **Authentication:** JWT + Passport
- **Payment:** Midtrans
- **WhatsApp:** Meta Cloud API

---

## 📋 **Environment Variables**

Copy `.env.example` to `.env` and configure:

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# JWT
JWT_SECRET="your-secret"

# OpenAI / OpenRouter
OPENAI_API_KEY="your-api-key"

# WhatsApp (optional)
WHATSAPP_ACCESS_TOKEN="..."

# Payment (optional)
MIDTRANS_SERVER_KEY="..."
```

---

## 🚀 **Deployment**

### Database (Supabase)
1. Create project at https://supabase.com
2. Copy connection strings to `.env`
3. Run: `npx prisma migrate deploy`

### Backend (Railway)
1. Push code to GitHub
2. Deploy on https://railway.app
3. Set environment variables
4. Deploy!

### Frontend (Vercel)
Coming soon...

See [DEPLOYMENT.md](backend/DEPLOYMENT.md) for detailed guide.

---

## 📊 **Project Structure**

```
aicoffeeshop/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # Authentication
│   │   │   ├── ai/         # AI Service
│   │   │   ├── menu/       # Menu Management
│   │   │   ├── order/      # Order Management
│   │   │   ├── payment/    # Payment Gateway
│   │   │   ├── whatsapp/   # WhatsApp Integration
│   │   │   └── table/      # QR Table System
│   │   ├── common/         # Shared utilities
│   │   └── prisma/         # Database service
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Sample data
│   └── docs/               # Documentation
├── IMPLEMENTATION_SUMMARY.md
└── README.md
```

---

## 🧪 **Testing**

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📚 **Documentation**

- [Quick Start Guide](backend/QUICKSTART.md)
- [API Documentation](backend/README.md)
- [Deployment Guide](backend/DEPLOYMENT.md)
- [WhatsApp Setup](backend/docs/WHATSAPP_SETUP.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

---

## 🔐 **Default Credentials (After Seeding)**

**Admin:**
- Email: `admin@coffeeshop.com`
- Password: `admin123`

**Staff:**
- Email: `staff@coffeeshop.com`
- Password: `staff123`

---

## 📈 **Features**

### Phase 1 (✅ Complete)
- [x] User Authentication (JWT)
- [x] Menu Management
- [x] Order Management
- [x] AI Chat Assistant
- [x] Database Schema

### Phase 2 (🟡 In Progress)
- [x] WhatsApp Integration
- [x] Payment Gateway (Midtrans)
- [x] QR Code System
- [ ] Email Notifications

### Phase 3 (⏳ Planned)
- [ ] Frontend Dashboard (Next.js)
- [ ] Real-time Updates
- [ ] Analytics Dashboard

---

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 **License**

Proprietary software. All rights reserved.

---

## 👥 **Support**

For issues and questions:
- Create an issue on GitHub
- Email: support@aicoffeeshop.com

---

**Built with ❤️ using NestJS and Prisma**
