import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await db.crossPostSubscription.findFirst({
      where: { userId: session.id, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      include: {
        plan: true,
        targetLinks: { include: { target: true } },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 20,
          include: { target: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        provider: subscription.provider,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          price: subscription.plan.price,
          interval: subscription.plan.interval,
          maxSites: subscription.plan.maxSites,
        },
        targets: subscription.targetLinks.map((st) => ({
          id: st.target.id,
          name: st.target.name,
          slug: st.target.slug,
        })),
        submissions: subscription.submissions.map((s) => ({
          id: s.id,
          target: s.target.name,
          status: s.status,
          externalUrl: s.externalUrl,
          error: s.error,
          submittedAt: s.submittedAt,
          publishedAt: s.publishedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get cross-post status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}