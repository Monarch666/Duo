import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Global reference to prevent multiple db connections during Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __sqliteDbInstance: Database.Database | undefined;
}

function initTables(sqlite: Database.Database) {
  sqlite.exec(`
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
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS love_note_replies (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES love_notes(id) ON DELETE CASCADE,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS daily_prompts (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_text TEXT NOT NULL,
      day_number INTEGER DEFAULT 312,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS daily_prompt_answers (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL REFERENCES daily_prompts(id) ON DELETE CASCADE,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS partner_moods (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      label TEXT NOT NULL,
      note TEXT,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS partner_moods_couple_user_idx ON partner_moods(couple_id, user_id);
  `);
}

export function getSqliteDb(customPath?: string): Database.Database {
  if (global.__sqliteDbInstance && !customPath) {
    try {
      initTables(global.__sqliteDbInstance);
    } catch (e) {
      console.error('Error running initTables on cached instance:', e);
    }
    return global.__sqliteDbInstance;
  }

  const dbPath =
    customPath ||
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), 'data', 'duo.db');

  const dbDir = path.dirname(path.resolve(/*turbopackIgnore: true*/ dbPath));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);

  // High performance & integrity SQLite PRAGMAs
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');

  // Auto-migration: ensure love notes, daily prompts, and partner moods tables exist
  initTables(sqlite);

  if (!customPath && process.env.NODE_ENV !== 'production') {
    global.__sqliteDbInstance = sqlite;
  }

  return sqlite;
}

export const sqlite = getSqliteDb();
export const db = drizzle(sqlite, { schema });
export type DatabaseInstance = typeof db;
