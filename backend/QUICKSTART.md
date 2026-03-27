# 🚀 Quick Start Guide - AI Coffee Shop Platform

Get up and running in 5 minutes!

## Option 1: Docker (Easiest)

### 1. Start All Services

```bash
cd backend
docker-compose up -d
```

This starts:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ Backend API (port 3000)
- ✅ pgAdmin UI (port 5050)

### 2. Run Migrations

```bash
docker exec -it ai-coffee-backend npm run prisma:migrate
docker exec -it ai-coffee-backend npm run prisma:seed
```

### 3. Test API

```bash
curl http://localhost:3000/api/health
```

**Done!** ✅ Your backend is running!

---

## Option 2: Local Development

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

#### Using Docker for PostgreSQL only:

```bash
docker run --name ai-coffee-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_coffee_shop \
  -p 5432:5432 \
  -d postgres:14
```

#### Or use local PostgreSQL:

```bash
# Make sure PostgreSQL is running
createdb ai_coffee_shop
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your database URL (and optionally OpenAI API key).

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Migrations

```bash
npm run prisma:migrate
```

### 6. Seed Database

```bash
npm run prisma:seed
```

### 7. Start Development Server

```bash
npm run start:dev
```

**Done!** ✅ Server running at http://localhost:3000

---

## 🧪 Test the API

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

### 2. Get Menu

```bash
curl http://localhost:3000/api/menu/items
```

### 3. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+6281234567890",
    "password": "password123"
  }'
```

### 4. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 5. AI Chat (No API Key Needed - Uses Mock)

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo, saya mau pesan kopi",
    "sessionId": "test-session-123",
    "channel": "WEB"
  }'
```

### 6. Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "QR",
    "tableNumber": "5",
    "customerName": "John Doe",
    "customerPhone": "+6281234567890",
    "items": [
      {
        "itemId": "ITEM_ID_FROM_MENU",
        "quantity": 1,
        "notes": "Extra hot"
      }
    ]
  }'
```

---

## 📊 Access Database UI (Docker only)

Open browser: http://localhost:5050

- **Email:** admin@aicoffeeshop.com
- **Password:** admin

Add connection:
- **Host:** postgres
- **Port:** 5432
- **Username:** postgres
- **Password:** postgres
- **Database:** ai_coffee_shop

---

## 🛑 Stop Services

### Docker

```bash
cd backend
docker-compose down
```

### Local

```bash
# Stop Node.js server
Ctrl+C

# Stop PostgreSQL (Docker)
docker stop ai-coffee-db
docker rm ai-coffee-db
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Error

Check if PostgreSQL is running:

```bash
# Docker
docker ps | grep postgres

# Local
pg_isready
```

### Prisma Errors

```bash
# Reset and regenerate
npx prisma generate
npx prisma migrate dev
```

### Permission Issues (Linux/Mac)

```bash
sudo chown -R $(whoami) node_modules
```

---

## 📚 Next Steps

1. **Explore API** - Check README.md for full API documentation
2. **Configure AI** - Add your OpenAI API key to `.env`
3. **Setup WhatsApp** - Configure WhatsApp Business API
4. **Build Frontend** - Create React dashboard
5. **Deploy** - Use Docker or deploy to cloud (AWS, Railway, etc.)

---

## 🎯 Default Test Credentials

After seeding, you can login with:

**Admin:**
- Email: admin@coffeeshop.com
- Password: admin123

**Staff:**
- Email: staff@coffeeshop.com
- Password: staff123

**Customer:**
- Phone: +6281234567892
- (Use login/phone endpoint)

---

**Happy Coding!** ☕🚀
