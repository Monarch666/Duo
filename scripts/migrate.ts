import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment!');
  process.exit(1);
}

async function runMigration() {
  console.log('[Migrate] Connecting to Supabase PostgreSQL...');
  const sql = postgres(connectionString!, {
    max: 1,
    prepare: false,
    ssl: 'require',
  });

  try {
    const migrationFile = path.join(process.cwd(), 'drizzle', '0000_tough_typhoid_mary.sql');
    const content = fs.readFileSync(migrationFile, 'utf-8');
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`[Migrate] Executing ${statements.length} migration statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await sql.unsafe(stmt);
      } catch (err: any) {
        // If table or constraint already exists, log and continue
        if (err.code === '42P07' || err.code === '42710') {
          console.log(`[Migrate] Already exists: statement ${i + 1}`);
        } else {
          console.error(`[Migrate] Error on statement ${i + 1}:`, err.message);
          throw err;
        }
      }
    }

    console.log('[Migrate] Successfully applied all migrations to Supabase!');
  } finally {
    await sql.end();
  }
}

runMigration().catch((err) => {
  console.error('[Migrate] Migration failed:', err);
  process.exit(1);
});
