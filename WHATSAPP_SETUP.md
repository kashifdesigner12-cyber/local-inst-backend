
---

FILE: WHATSAPP_SETUP.md

```markdown
# 📲 Meta WhatsApp Cloud API Setup Guide

This guide explains how to configure the official **Meta WhatsApp Cloud API** for automated student attendance and performance notifications.

---

## 🔑 Architecture Overview

We use the official **Meta WhatsApp Cloud API (Graph API)** via Axios.
- **No WhatsApp Web QR automation**
- **No unofficial puppeteer bots**
- **Direct Meta Graph API integration**:
  `POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages`

---

## 🛠️ Step-by-Step Meta Setup

### 1. Create a Meta Developer Account
1. Visit [developers.facebook.com](https://developers.facebook.com/) and register/sign in.
2. Click **My Apps** > **Create App**.
3. Select **Business** as the app type and enter your app name (e.g. `School Management System`).

### 2. Add WhatsApp Product
1. In your App Dashboard, find **WhatsApp** and click **Set up**.
2. Link your **Meta Business Account**.
3. Meta will provide a sandbox test environment with:
   - **Temporary Access Token** (or Permanent System User Token)
   - **Phone Number ID** (e.g. `100609349600000`)
   - **WhatsApp Business Account ID** (e.g. `104958309500000`)

### 3. Configure `.env` Variables
Update your `.env` file in the backend root:

```env
WHATSAPP_ACCESS_TOKEN=EAAB...your_system_user_access_token...
WHATSAPP_PHONE_NUMBER_ID=100609349600000
WHATSAPP_BUSINESS_ACCOUNT_ID=104958309500000
WHATSAPP_API_VERSION=v20.0

WHATSAPP_TEMPLATE_ABSENT=attendance_absent
WHATSAPP_TEMPLATE_PRESENT=attendance_present
WHATSAPP_TEMPLATE_PERFORMANCE=performance_report