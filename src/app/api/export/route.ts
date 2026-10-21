import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { ZipArchive } from 'archiver';
import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return NextResponse.json({ error: 'Unauthorized or not paired' }, { status: 401 });
  }

  try {
    const dal = createCoupleDal({ userId: auth.user.id, coupleId: auth.couple.coupleId });
    const coupleData = await dal.couple.exportAllData();
    const details = await dal.couple.getDetails();

    const timestamp = new Date().toISOString().slice(0, 10);
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');

    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = new ZipArchive({ zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('error', (err: unknown) => reject(err));
      archive.on('end', () => resolve(Buffer.concat(chunks)));

      // 1. duo-space-data.json
      const fullExport = {
        metadata: {
          exportedAt: new Date().toISOString(),
          coupleId: auth.couple?.coupleId,
          inviteCode: auth.couple?.inviteCode,
          exportedBy: auth.user.displayName,
          members: details.members,
        },
        data: coupleData,
      };
      archive.append(JSON.stringify(fullExport, null, 2), { name: 'duo-space-data.json' });

      // 2. README.txt
      const readmeContent = `Duo Space Backup Archive
Exported on: ${new Date().toLocaleString()}
Couple Code: ${auth.couple?.inviteCode}
Members: ${details.members.map((m) => `${m.displayName} (${m.email})`).join(', ')}

This archive contains:
1. duo-space-data.json: Complete records for calendar events, shared lists, check-ins, memories, and preferences.
2. photos/: All uploaded full-resolution memory photos from your couple space.
`;
      archive.append(readmeContent, { name: 'README.txt' });

      // 3. Attach all couple photos
      if (fs.existsSync(uploadsDir) && Array.isArray(coupleData.memories)) {
        for (const memory of coupleData.memories) {
          if (memory.photoPath) {
            const photoFile = path.join(uploadsDir, memory.photoPath);
            if (fs.existsSync(photoFile)) {
              archive.file(photoFile, { name: `photos/${memory.photoPath}` });
            }
          }
        }
      }

      archive.finalize();
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="duo-space-backup-${timestamp}.zip"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Export API Error]', error);
    return NextResponse.json({ error: 'Failed to generate export archive' }, { status: 500 });
  }
}
