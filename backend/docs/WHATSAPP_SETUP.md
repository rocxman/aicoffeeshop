# 📱 WhatsApp Business API Integration Guide

## 🎯 Overview

This guide walks you through setting up WhatsApp Business API integration for the AI Coffee Shop Platform.

---

## 📋 Prerequisites

- Meta Business account (Facebook Business)
- Verified Facebook Business Manager
- Phone number for WhatsApp Business (not already on WhatsApp)
- Server with public URL (for webhooks)

---

## 🚀 Step 1: Create Meta Business App

### 1.1 Go to Meta Developers Portal
1. Visit: https://developers.facebook.com
2. Click **"My Apps"** → **"Create App"**
3. Select app type: **"Business"**
4. Fill in:
   - **App Name:** AI Coffee Shop WhatsApp
   - **Business Account:** Select your business
5. Click **"Create App"**

### 1.2 Add WhatsApp Product
1. In your app dashboard, find **"WhatsApp"** product
2. Click **"Set Up"**
3. Accept terms if prompted

---

## 🚀 Step 2: Get API Credentials

### 2.1 Get Phone Number ID
1. In WhatsApp dashboard, go to **"API Setup"**
2. Under **"Add phone number"**, either:
   - Add a new number (recommended for testing)
   - Use existing WhatsApp Business API number
3. Copy the **Phone Number ID** (looks like: `123456789012345`)

### 2.2 Get Business Account ID
1. Go to **"Business Settings"** → **"Accounts"** → **"WhatsApp Business Accounts"**
2. Copy the **Business Account ID**

### 2.3 Generate Access Token
1. Go to **"API Setup"** in WhatsApp dashboard
2. Under **"Access Tokens"**, click **"Generate Token"**
3. Select your business account
4. Copy the **Permanent Access Token** (starts with `EAA...`)

⚠️ **IMPORTANT:** Save this token securely - you can only see it once!

### 2.4 Get App Secret
1. Go to **"Settings"** → **"Basic"**
2. Copy the **App Secret**
3. Click **"Show"** and confirm

---

## 🚀 Step 3: Configure Webhook

### 3.1 Create Verify Token
Choose a secure string for your verify token (e.g., `whatsapp_verify_token_2026`).
Save this in your `.env` file.

### 3.2 Setup Webhook URL
Your webhook URL should be: `https://your-domain.com/whatsapp/webhook`

For local development, use **ngrok**:
```bash
# Install ngrok (if not installed)
npm install -g ngrok

# Run ngrok
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### 3.3 Configure Webhook in Meta
1. Go to **"Configuration"** in WhatsApp dashboard
2. Under **"Webhooks"**, click **"Edit"**
3. Enter:
   - **Callback URL:** `https://your-ngrok-url.ngrok.io/whatsapp/webhook`
   - **Verify Token:** Your custom verify token
4. Click **"Verify and Save"**

### 3.4 Subscribe to Events
After webhook is verified:
1. Click **"Manage"** next to your webhook
2. Subscribe to these events:
   - ✅ `messages`
   - ✅ `message_deliveries`
   - ✅ `message_reads`
3. Click **"Save"**

---

## 🚀 Step 4: Configure Environment

Update your `.env` file:

```env
# WhatsApp Business API
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_PHONE_ID="123456789012345"
WHATSAPP_BUSINESS_ID="987654321098765"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="whatsapp_verify_token_2026"
WHATSAPP_API_VERSION="v18.0"
WHATSAPP_BASE_URL="https://graph.facebook.com"
```

---

## 🚀 Step 5: Test Integration

### 5.1 Start Your Server
```bash
cd backend
npm run start:dev
```

### 5.2 Test Webhook Verification
Meta will send a GET request to your webhook URL.
Check your server logs for:
```
[WhatsAppWebhookService] Webhook verified successfully
```

### 5.3 Send Test Message
1. In WhatsApp dashboard, go to **"API Setup"**
2. Under **"Send a test message"**:
   - Enter your phone number (with country code, e.g., `+6281234567890`)
   - Click **"Send"**
3. You should receive a test message on WhatsApp

### 5.4 Test AI Conversation
1. Send a message to your WhatsApp number: `"Halo"`
2. Check server logs for AI processing
3. You should receive an AI response

### 5.5 Test via API (Optional)
```bash
# Test send message endpoint
curl -X POST http://localhost:3000/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+6281234567890",
    "message": "Halo, saya mau pesan kopi"
  }'
```

---

## 🚀 Step 6: Create Message Templates

Message templates are required for sending proactive messages (not in response to user messages).

### 6.1 Create Template in Meta
1. Go to **"Message Templates"** in WhatsApp dashboard
2. Click **"Create Template"**
3. Fill in:
   - **Name:** `order_confirmation`
   - **Language:** Indonesian (id)
   - **Category:** UTILITY
   - **Message:**
     ```
     Terima kasih telah memesan! ☕

     Order {{1}} telah dikonfirmasi.
     Total: {{2}}
     
     Kami akan memberitahu saat pesanan siap.
     ```
4. Click **"Save"** and submit for approval

### 6.2 Recommended Templates

#### Order Confirmation
```
Name: order_confirmation
Language: Indonesian (id)
Category: UTILITY

Terima kasih telah memesan! ☕

Order {{1}} telah dikonfirmasi.
Total: {{2}}

Kami akan memberitahu saat pesanan siap.
```

#### Order Ready
```
Name: order_ready
Language: Indonesian (id)
Category: UTILITY

Pesanan Anda siap! 🎉

Order {{1}} sudah bisa diambil.
Silakan datang ke kasir.

Terima kasih! ☕
```

#### Payment Reminder
```
Name: payment_reminder
Language: Indonesian (id)
Category: MARKETING

Halo! 👋

Pembayaran untuk order {{1}} belum selesai.
Total: {{2}}

Silakan selesaikan pembayaran Anda.
```

---

## 🔧 Troubleshooting

### Webhook Verification Failed
**Problem:** Meta can't verify your webhook

**Solutions:**
1. Check your webhook URL is publicly accessible (use ngrok for local dev)
2. Verify token matches exactly in `.env` and Meta dashboard
3. Check server is running and accessible
4. Look at server logs for errors

### Messages Not Received
**Problem:** Not receiving messages from users

**Solutions:**
1. Verify webhook is subscribed to `messages` event
2. Check phone number is correctly configured
3. Ensure user has sent a message first (24-hour session window)
4. Check server logs for incoming webhooks

### Messages Not Sent
**Problem:** AI responses not being sent

**Solutions:**
1. Verify access token is valid and not expired
2. Check Phone Number ID is correct
3. Ensure you're within 24-hour customer service window
4. For templates: verify template is approved

### Error Code 130429
**Problem:** Rate limit exceeded

**Solution:** WhatsApp has rate limits. Implement message queuing and delays between messages.

### Error Code 131047
**Problem:** Phone number not found

**Solution:** Double-check Phone Number ID in `.env` matches Meta dashboard.

---

## 📊 Monitoring

### Check WhatsApp Status
```bash
curl http://localhost:3000/whatsapp/status
```

Response:
```json
{
  "configured": true,
  "phoneId": "***2345"
}
```

### View Logs
```bash
# Watch for WhatsApp logs
tail -f logs/app.log | grep WhatsApp
```

---

## 💡 Best Practices

### 1. 24-Hour Customer Service Window
- You can only send free-form messages within 24 hours of user's last message
- After 24 hours, use approved message templates only

### 2. Message Quality
- Keep messages concise
- Use emojis appropriately
- Include clear call-to-action

### 3. Rate Limiting
- WhatsApp allows ~1000 messages/second
- Implement queuing for high volume

### 4. Error Handling
- Always handle API errors gracefully
- Log failed messages for retry
- Monitor error rates

### 5. Security
- Never commit `.env` with real tokens
- Rotate tokens periodically
- Use HTTPS in production
- Verify webhook signatures

---

## 📚 Additional Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Webhooks Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/overview#rate-limiting)

---

## ✅ Checklist

Before going to production:

- [ ] Meta Business account verified
- [ ] Phone number verified
- [ ] Webhook configured and tested
- [ ] Message templates created and approved
- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] Monitoring setup
- [ ] Security review completed
- [ ] Load testing completed

---

**Next Step:** Payment Gateway Integration (Week 6) 🚀
