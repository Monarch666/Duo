import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirName = `backup_${timestamp}`;
  const backupsRoot = path.join(process.cwd(), 'backups');
  const targetBackupDir = path.join(backupsRoot, backupDirName);

  console.log(`[Backup] Starting Duo local backup: ${backupDirName}`);

  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'duo.db');
  const uploadsDir = path.join(dataDir, 'uploads');

  if (!fs.existsSync(dbPath)) {
    console.error(`[Backup Error] Database file not found at: ${dbPath}`);
    process.exit(1);
  }

  // Ensure backup target directory exists
  fs.mkdirSync(targetBackupDir, { recursive: true });

  // 1. Verify SQLite database integrity before backup
  console.log('[Backup] Running SQLite PRAGMA integrity_check...');
  const db = new Database(dbPath, { readonly: true });
  const integrityResult = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
  const isHealthy = integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok';

  if (!isHealthy) {
    console.error('[Backup Error] SQLite integrity check failed:', integrityResult);
    db.close();
    process.exit(1);
  }
  console.log('[Backup] SQLite database integrity verified: OK');

  // 2. Perform safe SQLite backup (handles WAL file locks cleanly)
  const destDbPath = path.join(targetBackupDir, 'duo.db');
  console.log(`[Backup] Backing up SQLite database to: ${destDbPath}`);
  await db.backup(destDbPath);
  db.close();

  // 3. Backup Uploads Directory
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

  // 4. Write backup metadata
  const dbStat = fs.statSync(destDbPath);
  const metadata = {
    backupDate: new Date().toISOString(),
    backupId: backupDirName,
    sqliteDatabase: {
      fileName: 'duo.db',
      bytes: dbStat.size,
      integrity: 'ok',
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
  console.log(`[Backup] Database Size: ${(dbStat.size / 1024).toFixed(1)} KB`);
  console.log(`[Backup] Photos Backed Up: ${uploadedFileCount}`);
  console.log('--------------------------------------------------');
}

performBackup().catch((err) => {
  console.error('[Backup Fatal Error]', err);
  process.exit(1);
});
