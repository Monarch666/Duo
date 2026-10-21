# Duo — Private Space for Two

> **An intimate, private shared sanctuary built exclusively for exactly two partners.**  
> 100% self-hosted, running entirely on your local machine with zero external cloud dependencies.

---

## Architecture & Principles

- **Zero Cloud Dependencies**: Runs completely offline or on your home Wi-Fi network. No AWS, Supabase, Firebase, or external telemetry.
- **Single-File SQLite Database**: Managed via `better-sqlite3` and `drizzle-orm` at `./data/duo.db` with WAL mode enabled for instant, concurrent reads/writes.
- **Local Photo Vault**: All uploaded memory photos are saved locally in `./data/uploads` and served exclusively through an authenticated streaming route.
- **Realtime Sync**: Server-Sent Events (SSE) provide real-time updates across both partners' devices, with automatic 5-second polling fallback if SSE is disconnected.
- **Human-Crafted Aesthetic**: Designed with an editorial, tactile aesthetic using warm parchment backgrounds (`#FAF6EF`), solid card surfaces, refined typography (Playfair Display & Plus Jakarta Sans), and subtle micro-interactions. Strictly free from tacky AI gradients, frosted glassmorphism, or decorative emojis.
- **Strict 2-Member Couple Isolation**: Enforced by a centralized Data Access Layer (`src/lib/dal/index.ts`). Every database query is cryptographically bound to the authenticated user's `coupleId`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Actions, TypeScript, React 19) |
| **Styling** | Tailwind CSS v3 (custom warm neutral palette, solid surfaces) |
| **Database** | SQLite (`better-sqlite3`) + Drizzle ORM |
| **Auth** | Argon2id password hashing + SQLite `httpOnly` sessions |
| **Validation**| Zod schemas for all actions and API routes |
| **Realtime** | Server-Sent Events (SSE) with 5s polling fallback |
| **Storage** | Local disk (`./data/uploads`) with directory traversal protection |
| **Testing** | Vitest (30 unit & integration tests) |
| **PWA** | Web App Manifest, standalone display, responsive icons |

---

## Core Features

### 1. Shared Calendar
- **Views**: Seamlessly toggle between a monthly calendar grid and a chronological upcoming events list.
- **Categories**: Color-coded badges for Dates, Anniversaries, Travel, Reminders, and Milestones.
- **Quick Date Suggestions**: One-click preset ideas (e.g. *Stargazing Night*, *Cook a New Recipe*, *Weekend Road Trip*).
- **Time & Location**: Optional fields with notes and partner attribution.

### 2. Shared Lists
- **Categorized Lists**: Default lists for Date Ideas, Bucket List, Groceries, Gift Ideas, and custom lists.
- **Interactive Checklists**: Check and uncheck items with instantaneous visual strike-through and progress bar calculations.
- **Attribution**: Shows which partner completed each item and when.
- **Instant Item Insertion**: Add items on the fly with keyboard enter shortcuts.

### 3. Weekly Check-in (Dual-Submission Locked Vault)
- **Mood Scale**: Clean 1 to 5 numeric scale (1: Struggling, 2: Low, 3: Steady, 4: Good, 5: Thriving).
- **Dual Prompts**: Reflect on *What made you feel most connected this week?* and *One thing you can do to support each other next week*.
- **Privacy Vault**: Answers remain strictly concealed until **both** partners complete their check-in for the week. Once both have submitted, reflections are revealed side-by-side.
- **Historical Archive**: Review past check-ins anytime via the archive modal.

### 4. Memory Timeline
- **Chronological Feed**: Milestone memories ordered by date.
- **Local Photo Upload**: Direct file upload to `./data/uploads` with MIME-type and size validation (up to 10MB).
- **Photo Zoom**: Click any memory photo to inspect full-screen without compression artifacts.
- **Story Notes**: Rich captions and stories accompanying each moment.

### 5. Partner Preference Cards
- **Dual Vault Switcher**: Instantly switch between *Partner's List* (cheat sheet for thoughtful gestures) and *My Preferences* (your own personal tastes).
- **7 Guided Categories**:
  - Coffee & Tea Order
  - Comfort Food
  - Primary Love Language
  - Sweet & Savory Treats
  - Dislikes & Allergies
  - Gift Wishlist
  - Clothing & Shoe Sizes

### 6. Security, Privacy & Data Portability
- **Hard 2-Member Limit**: Once a couple has 2 members, no additional users can join that couple space under any circumstances.
- **Brute-Force Rate Limiting**: 5 failed login attempts lock the IP/email combination for 15 minutes.
- **Full Offline ZIP Export**: Export a complete `.zip` archive containing both the full JSON database dump and all full-resolution uploaded memory photos.
- **Unlink & Space Deletion**: Allows partners to safely export their data and dissolve the shared space with cascade deletion.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v24.12)
- **npm** or **pnpm**

### 2. Installation
Clone the repository and install dependencies:
```bash
cd "Relationship manager"
npm install
```

### 3. Initialize Database
Push the Drizzle ORM schema to create the local SQLite database at `./data/duo.db`:
```bash
npm run db:push
```

### 4. Seed Demo Couple
Populate the database with a pre-configured demo couple with calendar events, lists, weekly reflections, memories, and preferences:
```bash
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Pre-Seeded Demo Accounts

You can immediately log in using either partner's account:

| Partner | Email | Password | Role |
|---|---|---|---|
| **Sarah Chen** | `sarah@example.com` | `Password123!` | Creator |
| **Alex Morgan** | `alex@example.com` | `Password123!` | Partner |

> **Couple Invite Code**: `DUO-LOVE`

---

## Connecting from Mobile Phones (Home Wi-Fi)

To use Duo together with your partner on your smartphones:

1. Run the local network development server:
   ```bash
   npm run dev:lan
   ```
2. Find your machine's local IP address (e.g. `192.168.1.50` or `10.120.32.122`).
3. Open `http://<your-local-ip>:3000` in the mobile browser on both phones.
4. Add Duo to your home screen via the browser's **Add to Home Screen** or **Install App** button to launch it in standalone PWA mode.

---

## Backups & Data Export

### Automated Backup Script
Run the automated backup utility to create a timestamped backup with SQLite integrity verification:
```bash
npm run backup
```
This performs:
1. `PRAGMA integrity_check` on `./data/duo.db`.
2. Safe SQLite online backup API to `./backups/backup_<timestamp>/duo.db` (clean WAL-lock handling).
3. Copies all uploaded memory photos from `./data/uploads` into `./backups/backup_<timestamp>/uploads/`.
4. Writes `backup_metadata.json` with file counts, sizes, and timestamps.

### Browser UI Export
1. Click the **Settings (gear icon)** in the top right of the dashboard.
2. Choose **Full Archive (.zip)** to download a complete zip archive containing `duo-space-data.json`, `README.txt`, and the entire `photos/` folder.
3. Choose **JSON Only** for a lightweight text backup.

---

## Running Tests

Duo includes 30 unit and integration tests covering security, isolation, and all core features:

```bash
npm test
```

### Test Coverage Breakdown
- `test/dal-isolation.test.ts`: Strict coupleId scoping, cross-couple data leakage prevention, 2-member limit, login rate limiting (5 attempts → lockout).
- `test/calendar-and-lists.test.ts`: Event creation, category filtering, list creation, item check/uncheck attribution, progress calculations.
- `test/checkin-memories-preferences.test.ts`: Weekly check-in dual locked vault (answers hidden until both submit, revealed side-by-side), memory timeline, preference cards dual vault.
- `test/export-and-backup.test.ts`: SQLite PRAGMA integrity verification, comprehensive data export, PWA manifest and icons validation, backup directory structure.

---

## Project Structure

```
├── backups/                    # Local timestamped backups
├── data/
│   ├── duo.db                 # Local SQLite single-file database
│   └── uploads/               # Local memory photos
├── public/
│   ├── manifest.json          # PWA Web App Manifest
│   ├── favicon.ico            # Duo browser favicon
│   └── icons/                 # Duo PWA icons (192x192, 512x512, SVG)
├── scripts/
│   ├── seed.ts                # Database seeding script
│   ├── backup.ts              # Local backup & integrity script
│   └── generate-icons.ts      # PWA icon generator
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── export/        # Full .zip archive export route
│   │   │   ├── realtime/      # SSE and 5s polling fallback routes
│   │   │   ├── upload/        # Photo upload route
│   │   │   └── uploads/[file] # Authenticated photo streaming route
│   │   ├── login/             # Login page
│   │   ├── signup/            # Sign up page
│   │   ├── pair/              # Create or join couple space (invite codes)
│   │   ├── DashboardClient.tsx# Main couple space dashboard
│   │   ├── layout.tsx         # Root layout with PWA meta & fonts
│   │   └── globals.css        # Custom styles & design tokens
│   ├── components/
│   │   ├── calendar/          # Shared calendar grid, timeline, modal
│   │   ├── lists/             # Shared lists, checklists, modal
│   │   ├── checkin/           # Weekly check-in vault & reflections
│   │   ├── memories/          # Memory timeline, photo zoom, upload
│   │   └── preferences/       # Partner preference cards dual-vault
│   └── lib/
│       ├── auth/              # Password hashing, sessions, rate limits
│       ├── dal/               # Scoped Data Access Layer (strict isolation)
│       ├── db/                # SQLite connection & Drizzle schemas
│       ├── realtime/          # SSE bus & client hook
│       └── validations/       # Zod schemas for all forms & actions
└── test/                      # Vitest test suites (30 tests)
```

---

## License

Private and personal software. Built with care for two.
