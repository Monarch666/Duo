import postgres from 'postgres';
import fs from 'fs';

let connectionString = process.env.DATABASE_URL;
if (!connectionString && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      connectionString = trimmed.replace('DATABASE_URL=', '').replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function migrate() {
  console.log('Running Supabase PostgreSQL migration for Duo...');

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      user_agent TEXT,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      locked_until TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS couples (
      id TEXT PRIMARY KEY,
      invite_code TEXT UNIQUE NOT NULL,
      invite_code_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      anniversary_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS couple_members (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'partner',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT couple_members_couple_user_idx UNIQUE (couple_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'date_night',
      start_at TEXT NOT NULL,
      end_at TEXT,
      is_all_day BOOLEAN NOT NULL DEFAULT false,
      location TEXT,
      color TEXT DEFAULT '#EA4C53',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'custom',
      icon TEXT DEFAULT 'Heart',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_completed BOOLEAN NOT NULL DEFAULT false,
      completed_at TIMESTAMPTZ,
      completed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      prompt_one TEXT NOT NULL,
      prompt_two TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      revealed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS checkin_answers (
      id TEXT PRIMARY KEY,
      checkin_id TEXT NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mood INTEGER NOT NULL,
      answer_one TEXT NOT NULL,
      answer_two TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT checkin_answers_checkin_user_idx UNIQUE (checkin_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      memory_date TEXT NOT NULL,
      note TEXT,
      photo_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'custom',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS love_notes (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Morning Love Note',
      content TEXT NOT NULL,
      sign_off TEXT DEFAULT 'Forever yours',
      paper_style TEXT DEFAULT 'butter',
      taps_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS love_note_replies (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES love_notes(id) ON DELETE CASCADE,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS daily_prompts (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_text TEXT NOT NULL,
      day_number INTEGER DEFAULT 312,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS daily_prompt_answers (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL REFERENCES daily_prompts(id) ON DELETE CASCADE,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS partner_moods (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      label TEXT NOT NULL,
      note TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT partner_moods_couple_user_idx UNIQUE (couple_id, user_id)
    );
  `);

  console.log('All 17 tables created successfully in Supabase!');
  await sql.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
