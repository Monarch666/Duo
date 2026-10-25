import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('🌸 Creating or altering `cycles` table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      logged_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT,
      period_length INTEGER NOT NULL DEFAULT 5,
      cycle_length INTEGER NOT NULL DEFAULT 28,
      flow TEXT DEFAULT 'medium',
      symptoms TEXT DEFAULT '[]',
      mood TEXT DEFAULT 'sensitive',
      comfort_request TEXT,
      notes TEXT,
      partner_care_notified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    ALTER TABLE cycles ADD COLUMN IF NOT EXISTS end_date TEXT;
  `);
  console.log('✅ `cycles` table verified and ready in database!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
