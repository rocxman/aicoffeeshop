# ☕ AI Coffee Shop Assistant Platform

**Enterprise-Grade AI-Powered Ordering System for Modern Coffee Shops**

A complete omnichannel ordering platform with AI barista assistant, supporting WhatsApp, QR codes, web chat, and voice ordering.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-proprietary-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)
![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue)

---

## 🌟 Features

### 🤖 AI-Powered Ordering
- **Conversational AI Barista** - Natural language ordering via chat
- **Multi-Channel Support** - WhatsApp, QR, Web, Voice
- **Smart Recommendations** - AI suggests items based on preferences
- **Contextual Memory** - Remembers customer preferences and order history
- **Upselling Engine** - Intelligent product suggestions

### 📱 Omnichannel Experience
- **WhatsApp Integration** - Order via WhatsApp Business API
- **QR Code Ordering** - Scan and order at table
- **Web Chat Widget** - Embeddable chat for websites
- **Voice Ordering** - Hands-free voice commands

### 🛍️ Complete E-Commerce
- **Menu Management** - Categories, items, options, customizations
- **Order Lifecycle** - Full order tracking from pending to delivered
- **Payment Gateway** - QRIS, E-Wallet, Cards, Bank Transfer
- **Promo Engine** - Discount codes, bundles, BOGO deals
- **Loyalty Program** - Points, tiers, rewards

### 📊 Business Intelligence
- **Real-Time Dashboard** - Live order monitoring
- **Analytics** - Sales, popular items, peak hours
- **Customer Insights** - Order history, preferences, lifetime value
- **Inventory Tracking** - Stock management (coming soon)

### 🔐 Enterprise Security
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access** - Customer, Staff, Manager, Admin
- **Data Encryption** - Encrypted sensitive data
- **Audit Logging** - Complete activity trail

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Channels                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ WhatsApp │  │ QR Code  │  │   Web    │  │  Voice  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼─────────────┼─────────────┼───────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (NestJS)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│   AI Service   │  │  Order Service │  │  Menu Service  │
│   (OpenAI)     │  │   (Business)   │  │    (CRUD)      │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │   (Prisma)      │
                   └─────────────────┘
```

---

## 📂 Project Structure

```
ai-coffee-shop-assistant-platform/
├── backend/                      # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # Authentication & Authorization
│   │   │   ├── ai/              # AI Service & LLM Integration
│   │   │   ├── order/           # Order Management
│   │   │   ├── menu/            # Menu Management
│   │   │   ├── payment/         # Payment Processing
│   │   │   └── notification/    # WhatsApp, Email, Push
│   │   ├── common/              # Shared utilities, guards, decorators
│   │   ├── prisma/              # Database service
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.ts              # Sample data
│   │   └── migrations/          # Database migrations
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                     # React Dashboard (Coming Soon)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
└── docs/                         # Documentation (Coming Soon)
    ├── api/
    ├── architecture/
    └── deployment/
```

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup database (Docker)
docker run --name ai-coffee-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_coffee_shop \
  -p 5432:5432 \
  -d postgres:14

# Configure environment
cp .env.example .env

# Run migrations
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run start:dev
```

**Server runs at:** http://localhost:3000

See [backend/QUICKSTART.md](backend/QUICKSTART.md) for detailed setup.

---

## 📡 API Endpoints

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
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id/status` - Update status (Staff)

### AI
- `POST /api/ai/chat` - Chat with AI barista
- `POST /api/ai/whatsapp` - WhatsApp webhook

See [backend/README.md](backend/README.md) for full API documentation.

---

## 🧪 Testing

```bash
# Run tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker build -t ai-coffee-backend .
docker run -p 3000:3000 --env-file .env ai-coffee-backend
```

---

## 🔐 Default Credentials (After Seeding)

**Admin:**
- Email: `admin@coffeeshop.com`
- Password: `admin123`

**Staff:**
- Email: `staff@coffeeshop.com`
- Password: `staff123`

**Customer:**
- Phone: `+6281234567892`

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL 14+
- **ORM:** Prisma
- **AI:** OpenAI GPT-4
- **Auth:** JWT + Passport
- **Validation:** class-validator

### Frontend (Coming Soon)
- **Framework:** React 18
- **UI Library:** Material-UI
- **State:** Redux Toolkit
- **HTTP:** Axios

### DevOps
- **Container:** Docker
- **Orchestration:** Docker Compose
- **CI/CD:** GitHub Actions (coming soon)
- **Monitoring:** Winston logs

---

## 📊 Database Schema

### Core Tables
- **users** - User accounts (customers, staff, admin)
- **sessions** - AI conversation sessions
- **menu_categories** - Menu category hierarchy
- **menu_items** - Products with pricing
- **menu_options** - Customization options
- **orders** - Order headers
- **order_items** - Order line items
- **payments** - Payment transactions
- **promos** - Promotional campaigns
- **loyalty_points** - Customer rewards

See schema at: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

---

## 🎯 Roadmap

### Phase 1 - Core Platform ✅ (Current)
- [x] Backend API
- [x] Database schema
- [x] AI chat service
- [x] Order management
- [x] Authentication

### Phase 2 - Integrations (Next)
- [ ] WhatsApp Business API
- [ ] Payment gateway (Midtrans/Xendit)
- [ ] QR code generation
- [ ] Email notifications

### Phase 3 - Frontend
- [ ] Business dashboard (React)
- [ ] Customer web app
- [ ] Admin panel
- [ ] Analytics UI

### Phase 4 - Advanced Features
- [ ] Voice ordering
- [ ] Multi-branch support
- [ ] Inventory management
- [ ] Advanced analytics
- [ ] Mobile apps (iOS/Android)

---

## 🤝 Contributing

This is a proprietary project. For external contributions, please contact the maintainer.

---

## 📄 License

Proprietary software. All rights reserved.

---

## 👥 Team

Built with ❤️ by the AI Coffee Shop Team

---

## 📞 Support

- **Email:** support@aicoffeeshop.com
- **Documentation:** [See docs folder](docs/)
- **Issues:** Create an issue on GitHub

---

**Last Updated:** March 2026
