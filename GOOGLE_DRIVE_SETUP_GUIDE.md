# Duo: Google Drive Shared Vault Setup Guide

This guide walks you through setting up your **100% free Google Cloud & Google Drive integration** so Duo can sync photos, memories, calendar dates, and notes without requiring any backend servers.

---

## 1. Create a Free Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the project dropdown and click **"New Project"**.
3. Project Name: `Duo Sanctuary` (or any name you prefer).
4. Click **"Create"**.

---

## 2. Enable the Google Drive API

1. In the search bar at the top, search for **"Google Drive API"**.
2. Click on **Google Drive API** in the results.
3. Click the blue **"Enable"** button.

---

## 3. Configure OAuth Consent Screen

1. In the left sidebar, navigate to **APIs & Services** → **OAuth consent screen**.
2. User Type: Select **External** and click **Create**.
3. **App Information**:
   - App name: `Duo Sanctuary`
   - User support email: Select your email
   - Developer contact email: Enter your email
4. Click **Save and Continue**.
5. **Scopes**:
   - Click **Add or Remove Scopes**.
   - Search for `drive.file` (`https://www.googleapis.com/auth/drive.file`).
   - Check the box for `.../auth/drive.file`.
   - *(Note: This scope ensures Duo only has access to files it creates, and cannot touch your personal Google Drive documents or photos).*
   - Click **Update** → **Save and Continue**.
6. **Test Users**:
   - Add your Google email and your partner's Google email under **Test Users**.
   - Click **Save and Continue**.

---

## 4. Create OAuth Credentials

### For Web / Browser Testing:
1. In the left sidebar, navigate to **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Duo Web Client`.
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - Your local network IP (e.g. `http://192.168.x.x:3000`)
6. Click **Create**.
7. Copy the **Client ID** (it looks like `123456789-abcdefg.apps.googleusercontent.com`).

### For Android (Play Store APK / AAB):
1. In **Credentials**, click **+ Create Credentials** → **OAuth client ID**.
2. Application type: **Android**.
3. Name: `Duo Android App`.
4. Package name: `com.duo.sanctuary`
5. SHA-1 certificate fingerprint:
   - For debug builds: Run `keytool -keystore .android/debug.keystore -list -v`
   - For release builds: Paste the SHA-1 of your release upload key.
6. Click **Create**.

---

## 5. Adding the Client ID to Duo

Add your Web Client ID to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

---

## 6. How Duo Uses Google Drive

1. **Automatic Folder Creation**:
   - On first sign-in, Duo automatically creates a private folder in your Google Drive: `Duo Sanctuary - [Name]`.
   - A subfolder `photos/` is created inside for all polaroid memories.
2. **One-Tap Partner Sharing**:
   - When you enter your partner's email, Duo sends a writer invite directly through Google Drive permissions.
   - Both partners have instant read and write access to the same shared folder.
3. **Delta Syncing**:
   - All calendar dates, lists, check-ins, and love notes are stored in `events_log.json` inside that folder.
   - If either partner is offline, changes are safely cached in the phone's local database and synced once reconnected.

