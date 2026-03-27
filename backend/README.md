# ☕ AI Coffee Shop Assistant Platform - Backend

Enterprise-grade AI-powered ordering platform for coffee shops with support for multiple channels (WhatsApp, QR, Web, Voice).

## 🚀 Features

### Core Capabilities
- **AI Ordering Assistant** - Conversational AI barista powered by LLM
- **Omnichannel Support** - WhatsApp, QR Code, Web, Voice ordering
- **Smart Recommendations** - AI-powered menu suggestions and upselling
- **Order Management** - Complete order lifecycle tracking
- **Payment Integration** - Multiple payment methods (QRIS, E-Wallet, Cards)
- **Loyalty Program** - Points-based customer rewards
- **Promo Engine** - Discount codes and bundle promotions
- **Real-time Analytics** - Business intelligence dashboard

### Technical Highlights
- **Microservices Architecture** - Modular NestJS backend
- **PostgreSQL Database** - Production-ready schema with Prisma ORM
- **JWT Authentication** - Secure role-based access control
- **AI Tool Calling** - Function calling for menu/orders/promos
- **Session Management** - Context-aware conversations
- **Enterprise Security** - RBAC, encryption, audit logging

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn
- Docker (optional, for local PostgreSQL)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_coffee_shop?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION="7d"

# OpenAI (optional - will use mock responses if not configured)
OPENAI_API_KEY="sk-your-api-key"
OPENAI_MODEL="gpt-4o-mini"

# WhatsApp Business API (optional)
WHATSAPP_API_KEY="your-whatsapp-api-key"
WHATSAPP_PHONE_ID="your-phone-id"

# Payment Gateway (optional)
MIDTRANS_SERVER_KEY="your-midtrans-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with Docker
docker run --name ai-coffee-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_coffee_shop \
  -p 5432:5432 \
  -d postgres:14
```

#### Option B: Local PostgreSQL

```bash
# Create database manually
createdb ai_coffee_shop
```

### 4. Run Migrations and Seed

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

## 🏃 Running the Application

### Development Mode

```bash
npm run start:dev
```

Server will start on `http://localhost:3000` with auto-reload.

### Production Mode

```bash
# Build
npm run build

# Start
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/phone + password
- `POST /api/auth/login/phone` - Login with phone only (OTP-style)

### Menu
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/items` - Get all menu items
- `GET /api/menu/items/popular` - Get popular items
- `GET /api/menu/items/:id` - Get item details
- `POST /api/menu/items` - Create item (Admin/Manager)
- `PUT /api/menu/items/:id` - Update item (Admin/Manager)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/number/:orderNumber` - Get order by number
- `PUT /api/orders/:id/status` - Update order status (Staff)
- `GET /api/orders/stats/overview` - Get order statistics (Admin)

### AI Chat
- `POST /api/ai/chat` - Send message to AI assistant
- `POST /api/ai/whatsapp` - WhatsApp webhook
- `POST /api/ai/voice/transcribe` - Voice transcription

### Health Check
- `GET /api/health` - Health check endpoint
- `GET /` - Welcome message

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Database Schema

### Core Tables
- **users** - Customer and staff accounts
- **sessions** - AI conversation sessions
- **menu_categories** - Menu category hierarchy
- **menu_items** - Products with pricing
- **menu_options** - Customization options (size, sugar, etc.)
- **orders** - Order headers
- **order_items** - Order line items
- **payments** - Payment records
- **promos** - Promotional campaigns
- **loyalty_points** - Customer loyalty program

## 🔐 Authentication

The system uses JWT-based authentication with role-based access control (RBAC):

### Roles
- **CUSTOMER** - Regular customers
- **STAFF** - Order management
- **MANAGER** - Menu and staff management
- **ADMIN** - Full system access

### Usage
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+6281234567890",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 🤖 AI Configuration

### System Prompt
The AI behavior is defined in `src/modules/ai/prompts/system-prompt.ts`

### Tool Calling
AI can call these tools:
- `getMenu` - Fetch menu items
- `getMenuItem` - Get item details
- `createOrder` - Create order from conversation
- `getPromos` - Get active promotions
- `getOrderStatus` - Check order status
- `getBusinessHours` - Get operating hours

### Without OpenAI
If `OPENAI_API_KEY` is not configured, the system falls back to rule-based mock responses.

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📈 Monitoring

### Logs
Application logs are output to console with levels:
- `error` - Critical errors
- `warn` - Warnings
- `log` - General info
- `debug` - Debug info

### Health Checks
- `/api/health` - Basic health check
- Database connectivity checked automatically

## 🚨 Error Handling

The application uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Development Guidelines

### Code Style
- ESLint + Prettier configured
- TypeScript strict mode enabled

### Commit Messages
Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@aicoffeeshop.com

---

**Built with ❤️ using NestJS and Prisma**
