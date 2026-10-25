# Duo Sanctuary — Multi-City Distribution Guide

This guide explains how to share **Duo** with friends and couples located in other cities.

---

## 1. Cloud Web Service (Render)
- **Production URL**: `https://duo-16pf.onrender.com`
- **GitHub Repository**: [Monarch666/Duo](https://github.com/Monarch666/Duo)
- **Deployment Status**: Connected to the `main` branch with automatic deploys on git push.

### Required Environment Variables in Render Dashboard
Go to your **Render Dashboard** → **Duo** (`srv-dbe7r4jncjis73dau2og`) → **Environment**:
Ensure the following variables are present:

| Variable | Value | Notes |
|---|---|---|
| `NODE_VERSION` | `20.18.0` | Node.js engine |
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | `postgresql://postgres.dtwsthyzxprksadrwaiy:I$agiyoichi1602@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` | Supabase pooled connection |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dtwsthyzxprksadrwaiy.supabase.co` | Supabase Cloud API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public client anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Backend storage/realtime key |
| `SESSION_SECRET` | `duo_local_secure_session_key_9f81a7b3c2e1d04586f7a8b9c0d1e2f3` | Encrypts auth tokens |

---

## 2. Distributing the Android App (.apk)

The standalone Android APK has been compiled and is ready at:
📁 **`E:\Relationship manager\dist\Duo-Sanctuary.apk`** (approx. 4.9 MB)

### How to Distribute:
1. **Upload to Google Drive / OneDrive**:
   - Upload `Duo-Sanctuary.apk` to Google Drive or Dropbox.
   - Set link sharing to **"Anyone with the link can view"**.
   - Send the link to your friends via WhatsApp, Telegram, or email.
2. **Direct Transfer**:
   - Send `Duo-Sanctuary.apk` directly via Telegram or WhatsApp Documents.
3. **Installation on Android Devices**:
   - Tap the APK file on Android to install.
   - When prompted with *"Install unknown apps"*, toggle **Allow from this source**.
   - Open Duo! The app connects directly to `https://duo-16pf.onrender.com`.

### Cold-Start Behavior (Render Free Tier):
- If the server has been idle for >15 minutes, Render spins down the free container.
- When opening the app, a gentle screen appears: *"Waking up sanctuary... 🌸"*.
- The app automatically polls every 3 seconds and redirects into the sanctuary as soon as Render is awake (usually 30–40s).

---

## 3. Distributing via Web / PWA (iPhone, Mac, PC, Android)

For friends with iPhones or anyone who prefers not to install an APK:
1. Share the link: **`https://duo-16pf.onrender.com`**
2. **Install as App on iOS**:
   - Open in **Safari**.
   - Tap the **Share** button (box with upward arrow).
   - Tap **"Add to Home Screen"**.
   - The Duo otter icon appears on their home screen and launches fullscreen without browser bars.
3. **Install as App on Android**:
   - Open in **Chrome**.
   - Tap the three dots menu → **"Install app"** or **"Add to Home Screen"**.

---

## 4. How Remote Couples Join Together

1. **Partner 1**:
   - Opens the app / website.
   - Clicks **"Sign up"** and enters their name, email, and password.
   - On the pairing screen, clicks **"Create a Space for Us"**.
   - Receives a unique pairing code (e.g., `DUO-7K2M`).
   - Copies and sends this code to Partner 2.
2. **Partner 2**:
   - Opens the app / website on their phone (in their city).
   - Clicks **"Sign up"** and creates their account.
   - On the pairing screen, enters the code (`DUO-7K2M`) and clicks **"Join Partner"**.
3. **Done!**
   - Both partners enter the sanctuary together.
   - Changes, events, bucket lists, and photo memories sync instantly between both phones across any distance.
