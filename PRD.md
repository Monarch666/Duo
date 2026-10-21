# Product Requirements Document (PRD)

## Project: Duo — Private Shared Sanctuary for Two
**Version**: 1.0.0  
**Status**: Active Production  
**Target Platform**: Web, PWA (iOS / Android), Self-Hosted / Netlify + Supabase  

---

## 1. Product Vision & Overview

### 1.1 Executive Summary
**Duo** is an intimate, private digital sanctuary crafted exclusively for exactly **two partners**. In an era dominated by performative social media, algorithmic noise, and bloated productivity tools, Duo provides a calm, intentional, offline-first haven where couples can nurture their relationship, record memories, plan dates, align emotionally through weekly check-in rituals, and stay deeply connected.

### 1.2 Core Tenets & Philosophy
- **Absolute Couple Exclusivity**: Every space is strictly hard-limited to exactly 2 members. No third parties, no social feeds, no public profiles, no followers.
- **Privacy & Sovereignty**: Zero cloud tracking or third-party ad telemetry. Can run 100% locally on home Wi-Fi or with personal cloud databases (Supabase).
- **Tactile, Editorial Warmth**: Designed like a handcrafted scrapbook and luxury stationery (warm parchment `#FAF6EF`, solid warm cards, Playfair Display & Plus Jakarta Sans, polaroid frames, and wax-sealed reflections). Strictly anti-AI slop (no generic neon gradients or frosted glass).
- **Mutual Reciprocity**: Key relationship features (such as weekly reflections) use a locked dual-submission vault—answers remain sealed until both partners have contributed.

---

## 2. Target Personas

### Persona A: The Intentional Partner
- Wants a dedicated space to remember meaningful moments, track special anniversaries, and leave affectionate notes without them getting lost in messaging apps (WhatsApp/iMessage).
- Values aesthetic refinement and emotional depth over gamification.

### Persona B: The Thoughtful Planner
- Loves organizing future date nights, weekend getaways, and shared bucket lists.
- Appreciates having partner preference cheat sheets (coffee orders, ring/clothing sizes, love language) on hand when buying gifts or planning surprises.

---

## 3. Core Features & Functional Requirements

### 3.1 Couple Authentication & Pairing
- **User Registration & Login**: Email and password authentication with Argon2id cryptographic hashing and brute-force lockout (5 attempts $\to$ 15-minute freeze).
- **Single-Use Pairing Protocol**:
  - Partner 1 creates the couple space and receives an 8-character invite code (e.g., `DUO-LOVE`).
  - Partner 2 registers and inputs the invite code to link the accounts.
  - The pairing screen polls automatically every 3 seconds to auto-transition both partners to the sanctuary once linked.
- **Strict 2-Member Limit**: Attempts to join an already paired space are rejected at both the DAL and database constraint level.

### 3.2 Shared Dates & Calendar
- **Monthly Grid & Chronological List**: Toggle between a visual calendar grid and an upcoming event feed.
- **Categorized Milestones**: Tag events as *Anniversary*, *Date Night*, *Weekend Trip*, *Reminder*, or *Milestone*.
- **Quick Date Suggestions**: One-click preset ideas (*Stargazing Picnic*, *Cook Homemade Pasta*, *Couples Pottery Class*).
- **Metadata**: Date, optional time, location, description, and attribution badge showing who planned the date.

### 3.3 Shared Bucket Lists & Date Ideas
- **Multi-Category Lists**: Pre-seeded with *Dream Date Nights*, *Life Bucket List*, *Groceries*, *Gift Ideas*, and support for custom lists.
- **Interactive Checklists**: Check/uncheck items with real-time strike-through animations and completion attribution (*"Completed by Alex"*).
- **Progress Tracking**: Real-time completion progress bar (e.g., `2 of 3 completed (67%)`).
- **Instant Item Insertion**: Inline keyboard input with auto-focus.

### 3.4 Weekly Rituals (Dual-Submission Locked Vault)
- **Weekly Prompts**: Automatic ISO week tracking with guided reflection prompts:
  1. *What was your favorite moment of us together this week?*
  2. *What is one thing I can do to make you feel extra loved next week?*
- **Heart Energy & Mood Scale**: 1 to 5 scale (Struggling $\to$ Joyful).
- **Wax-Sealed Reciprocal Privacy**: Answers remain strictly concealed under an *Envelope Sealed* state until **both** partners complete their reflection. Once both submit, the vault unseals to display side-by-side responses.
- **Ritual Archives**: Historical access to all past weeks' reflections.

### 3.5 Polaroid Keepsake Vault (Memories)
- **Chronological Memory Stream**: Visual card stream of milestone moments ordered by date.
- **Polaroid Styling**: Classic polaroid photo frames with subtle shadows and handwriting captions.
- **Local / Cloud Photo Uploads**: Support for JPEG, PNG, WebP image uploads up to 10MB with image zoom lightbox modal.
- **Story Notes**: Rich text reflections accompanying each memory.

### 3.6 Love Map (Partner Preferences Cheat Sheet)
- **Dual-Vault Toggle**: Switch effortlessly between *My Preferences* and *Partner's Cheat Sheet*.
- **7 Guided Categories**:
  1. Coffee & Tea Order (temperature, milk, sweetness)
  2. Comfort Foods (favorite meals when tired or sick)
  3. Primary Love Language (Words of Affirmation, Quality Time, Acts of Service, Gifts, Physical Touch)
  4. Sweet & Savory Treats
  5. Dislikes & Allergies
  6. Gift Wishlist
  7. Clothing & Shoe Sizes

### 3.7 Live Sanctuary Micro-Interactions
- **Realtime Sync**: Server-Sent Events (SSE) stream with a 5-second polling fallback.
- **Live Connection Pulse**: Status badge displaying `• Live Sync • 72 BPM` showing when your partner is online.
- **Kyoto Rain Ambient Soundscape**: Synthesized binaural rain audio built directly with the Web Audio API (zero audio file downloads required).
- **Floating Heart Reactions**: Real-time floating hearts on note reads and mood updates.
- **Persistent Daily Moods**: Current partner mood badge with custom notes and quick emojis.

### 3.8 Security, Data Portability & Dissolution
- **Full Offline ZIP Export**: One-click download of all memories, JSON database dump, and high-resolution uploaded photos.
- **Space Dissolution**: Ability for either partner to unlink and cleanly delete all shared data with cascading removal.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Responsiveness
- Server response times under 100ms for data queries.
- Instant optimistic UI updates for list checking, mood changes, and notes.
- Fully responsive across desktop, tablet, and mobile viewport sizes (375px to 1920px).

### 4.2 Security & Data Integrity
- Passwords hashed using Argon2id with unique salts.
- Sessions stored in SQLite/PostgreSQL with `httpOnly`, `SameSite=Lax`, `Secure` cookies.
- All DAL operations strictly scoped to `coupleId` extracted from the verified session.

---

## 5. Technology Stack Summary

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **Styling**: Tailwind CSS v3 (Custom warm palette, tactile paper aesthetics)
- **Database**: SQLite (`better-sqlite3`) + Drizzle ORM $\to$ Supabase PostgreSQL migration ready
- **Realtime**: Server-Sent Events (SSE) + Supabase Realtime Channels
- **Storage**: Local filesystem `./data/uploads` $\to$ Supabase Storage S3 Bucket
- **Testing**: Vitest (30 unit & integration test suite)
- **PWA**: Web App Manifest, Standalone display, SVG & PNG responsive icons
