import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

/**
 * Serves member uploads from public/uploads. Next's `next start` only serves
 * files that existed at build time, so photos written after deploy must be
 * read through this route. A path-traversal guard ensures members can never
 * escape the uploads directory.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!segments || segments.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const resolved = path.resolve(uploadsDir, ...segments);

    if (resolved !== uploadsDir && !resolved.startsWith(uploadsDir + path.sep)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const data = await fs.readFile(resolved);
    const type = MIME_BY_EXT[path.extname(resolved).toLowerCase()] ?? 'application/octet-stream';
    return new NextResponse(data, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}