import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createCoupleDal } from '@/lib/dal';
import { db } from '@/lib/db';
import { couples, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Phase 4: Export, Backup & Data Integrity', () => {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'duo.db');

  it('passes SQLite PRAGMA integrity_check', () => {
    const sqlite = new Database(dbPath, { readonly: true });
    const result = sqlite.pragma('integrity_check') as Array<{ integrity_check: string }>;
    sqlite.close();

    expect(result).toHaveLength(1);
    expect(result[0].integrity_check).toBe('ok');
  });

  it('exports comprehensive scoped couple data', async () => {
    const demoCouple = db
      .select()
      .from(couples)
      .where(eq(couples.inviteCode, 'DUO-LOVE'))
      .get();

    expect(demoCouple).toBeDefined();
    if (!demoCouple) return;

    const demoUser = db
      .select()
      .from(users)
      .where(eq(users.email, 'sarah@example.com'))
      .get();

    expect(demoUser).toBeDefined();
    if (!demoUser) return;

    const dal = createCoupleDal({ userId: demoUser.id, coupleId: demoCouple.id });
    const exportedData = await dal.couple.exportAllData();

    expect(exportedData).toHaveProperty('exportedAt');
    expect(exportedData.couple).toBeDefined();
    expect(exportedData.couple?.id).toBe(demoCouple.id);
    expect(Array.isArray(exportedData.events)).toBe(true);
    expect(Array.isArray(exportedData.lists)).toBe(true);
    expect(Array.isArray(exportedData.listItems)).toBe(true);
    expect(Array.isArray(exportedData.checkins)).toBe(true);
    expect(Array.isArray(exportedData.memories)).toBe(true);
    expect(Array.isArray(exportedData.preferences)).toBe(true);
  });

  it('verifies PWA manifest and icons exist in public directory', () => {
    const publicDir = path.join(process.cwd(), 'public');
    const manifestPath = path.join(publicDir, 'manifest.json');
    const icon192 = path.join(publicDir, 'icons', 'icon-192x192.png');
    const icon512 = path.join(publicDir, 'icons', 'icon-512x512.png');
    const iconSvg = path.join(publicDir, 'icons', 'icon.svg');
    const favicon = path.join(publicDir, 'favicon.ico');

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(icon192)).toBe(true);
    expect(fs.existsSync(icon512)).toBe(true);
    expect(fs.existsSync(iconSvg)).toBe(true);
    expect(fs.existsSync(favicon)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifestContent.name).toBe('Duo — Private Space for Two');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.theme_color).toBe('#FAF6EF');
  });

  it('verifies backup directory structure and integrity metadata', () => {
    const backupsDir = path.join(process.cwd(), 'backups');
    expect(fs.existsSync(backupsDir)).toBe(true);

    const backups = fs.readdirSync(backupsDir).filter((f) => f.startsWith('backup_'));
    expect(backups.length).toBeGreaterThan(0);

    const latestBackup = path.join(backupsDir, backups[backups.length - 1]);
    expect(fs.existsSync(path.join(latestBackup, 'duo.db'))).toBe(true);
    expect(fs.existsSync(path.join(latestBackup, 'uploads'))).toBe(true);
    expect(fs.existsSync(path.join(latestBackup, 'backup_metadata.json'))).toBe(true);

    const metadata = JSON.parse(
      fs.readFileSync(path.join(latestBackup, 'backup_metadata.json'), 'utf-8')
    );
    expect(metadata.sqliteDatabase.integrity).toBe('ok');
    expect(metadata.sqliteDatabase.fileName).toBe('duo.db');
  });
});
