import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { filename } = await params;
  const safeFilename = path.basename(filename);

  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  const filePath = path.join(uploadsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return new Response('Not Found', { status: 404 });
  }

  const ext = safeFilename.split('.').pop()?.toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === 'png') contentType = 'image/png';
  if (ext === 'webp') contentType = 'image/webp';
  if (ext === 'gif') contentType = 'image/gif';

  try {
    const fileBuffer = await fs.promises.readFile(filePath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    return new Response('Error loading image', { status: 500 });
  }
}
