import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import type { AdminStats } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProfiles,
      totalMatches,
      acceptedMatches,
      totalMessages,
      activeToday,
      bannedUsers,
      pendingReports,
    ] = await Promise.all([
      db.user.count(),
      db.profile.count(),
      db.match.count(),
      db.match.count({ where: { status: 'ACCEPTED' } }),
      db.message.count(),
      db.user.count({ where: { lastLogin: { gte: oneDayAgo } } }),
      db.user.count({ where: { isBanned: true } }),
      db.report.count({ where: { status: 'PENDING' } }),
    ]);

    const users: AdminStats['users'] = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { profile: true },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        isBanned: row.isBanned,
        ageVerified: row.ageVerified,
        lastLogin: row.lastLogin?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        profile: row.profile
          ? {
              displayName: row.profile.displayName,
              gender: row.profile.gender,
              location: row.profile.location,
              profilePicture: row.profile.profilePicture,
            }
          : null,
      }))
    );

    const reports: AdminStats['reports'] = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        reporterId: row.reporterId,
        reportedId: row.reportedId,
        reason: row.reason,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      }))
    );

    const stats: AdminStats = {
      totalUsers,
      totalProfiles,
      totalMatches,
      acceptedMatches,
      totalMessages,
      activeToday,
      bannedUsers,
      pendingReports,
      users,
      reports,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}