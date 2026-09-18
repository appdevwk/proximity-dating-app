import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeAdmin } from '@/lib/auth';
import { z } from 'zod';

const updateReportSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(['RESOLVED', 'DISMISSED', 'REVIEWING']),
  banUser: z.boolean().optional(),
});

export async function GET() {
  const auth = await authorizeAdmin();
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.reason === 'UNAUTHENTICATED' ? 'Unauthorized' : 'Forbidden' },
      { status: auth.reason === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }

  try {

    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true } },
      },
    });

    const data = reports.map((report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reporterName: report.reporter.name ?? report.reporter.email,
      reportedId: report.reportedId,
      reportedName: report.reported.name ?? report.reported.email,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    }));

    return NextResponse.json({ reports: data });
  } catch (error) {
    console.error('List reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdmin();
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.reason === 'UNAUTHENTICATED' ? 'Unauthorized' : 'Forbidden' },
      { status: auth.reason === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }

  try {

    const body = await request.json().catch(() => ({}));
    const validated = updateReportSchema.parse(body);

    const report = await db.report.findUnique({ where: { id: validated.reportId } });
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await db.report.update({
      where: { id: report.id },
      data: { status: validated.action },
    });

    if (validated.banUser) {
      await db.user.update({
        where: { id: report.reportedId },
        data: { isBanned: true },
      });
    }

    return NextResponse.json({ message: 'Report updated', reportId: report.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}