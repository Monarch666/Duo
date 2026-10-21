import fs from 'fs';
import path from 'path';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

import { db } from '../src/lib/db';
import * as schema from '../src/lib/db/schema';

async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirName = `backup_${timestamp}`;
  const backupsRoot = path.join(process.cwd(), 'backups');
  const targetBackupDir = path.join(backupsRoot, backupDirName);

  console.log(`[Backup] Starting Duo cloud backup: ${backupDirName}`);

  // Ensure backup target directory exists
  fs.mkdirSync(targetBackupDir, { recursive: true });

  // 1. Export all tables from Supabase PostgreSQL
  console.log('[Backup] Exporting database tables from Supabase...');
  const couplesData = await db.select().from(schema.couples);
  const usersData = await db.select().from(schema.users);
  const coupleMembersData = await db.select().from(schema.coupleMembers);
  const eventsData = await db.select().from(schema.events);
  const listsData = await db.select().from(schema.lists);
  const listItemsData = await db.select().from(schema.listItems);
  const checkinsData = await db.select().from(schema.checkins);
  const checkinAnswersData = await db.select().from(schema.checkinAnswers);
  const memoriesData = await db.select().from(schema.memories);
  const preferencesData = await db.select().from(schema.preferences);
  const notesData = await db.select().from(schema.loveNotes);
  const noteRepliesData = await db.select().from(schema.loveNoteReplies);
  const moodsData = await db.select().from(schema.partnerMoods);
  const promptsData = await db.select().from(schema.dailyPrompts);
  const promptAnswersData = await db.select().from(schema.dailyPromptAnswers);

  const dbSnapshot = {
    couples: couplesData,
    users: usersData,
    coupleMembers: coupleMembersData,
    events: eventsData,
    lists: listsData,
    listItems: listItemsData,
    checkins: checkinsData,
    checkinAnswers: checkinAnswersData,
    memories: memoriesData,
    preferences: preferencesData,
    loveNotes: notesData,
    loveNoteReplies: noteRepliesData,
    partnerMoods: moodsData,
    dailyPrompts: promptsData,
    dailyPromptAnswers: promptAnswersData,
  };

  const destDbPath = path.join(targetBackupDir, 'database_dump.json');
  fs.writeFileSync(destDbPath, JSON.stringify(dbSnapshot, null, 2), 'utf-8');
  console.log(`[Backup] Database dump saved to: ${destDbPath}`);

  // 2. Backup Uploads Directory if present
  const dataDir = path.join(process.cwd(), 'data');
  const uploadsDir = path.join(dataDir, 'uploads');
  const destUploadsDir = path.join(targetBackupDir, 'uploads');
  fs.mkdirSync(destUploadsDir, { recursive: true });

  let uploadedFileCount = 0;
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const srcFile = path.join(uploadsDir, file);
      const stat = fs.statSync(srcFile);
      if (stat.isFile()) {
        fs.copyFileSync(srcFile, path.join(destUploadsDir, file));
        uploadedFileCount++;
      }
    }
  }
  console.log(`[Backup] Copied ${uploadedFileCount} uploaded memory photos to backup`);

  // 3. Write backup metadata
  const dbStat = fs.statSync(destDbPath);
  const metadata = {
    backupDate: new Date().toISOString(),
    backupId: backupDirName,
    database: {
      type: 'postgresql',
      fileName: 'database_dump.json',
      bytes: dbStat.size,
      totalUsers: usersData.length,
      totalCouples: couplesData.length,
      totalMemories: memoriesData.length,
    },
    uploads: {
      count: uploadedFileCount,
      path: 'uploads/',
    },
  };

  fs.writeFileSync(
    path.join(targetBackupDir, 'backup_metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  );

  console.log('--------------------------------------------------');
  console.log(`[Backup] Backup completed successfully!`);
  console.log(`[Backup] Location: ${targetBackupDir}`);
  console.log(`[Backup] Dump Size: ${(dbStat.size / 1024).toFixed(1)} KB`);
  console.log(`[Backup] Photos Backed Up: ${uploadedFileCount}`);
  console.log('--------------------------------------------------');
  process.exit(0);
}

performBackup().catch((err) => {
  console.error('[Backup Fatal Error]', err);
  process.exit(1);
});
