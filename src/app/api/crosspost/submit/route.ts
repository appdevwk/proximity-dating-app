import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await db.crossPostSubscription.findFirst({
      where: { userId: session.id, status: 'ACTIVE' },
      include: { targetLinks: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription.' }, { status: 402 });
    }

    if (subscription.targetLinks.length === 0) {
      return NextResponse.json({ error: 'No sites activated. Activate at least one site.' }, { status: 422 });
    }

    const submissions = await Promise.all(
      subscription.targetLinks.map((st) =>
        db.crossPostSubmission.create({
          data: {
            subscriptionId: subscription.id,
            targetId: st.targetId,
            status: 'PUBLISHED',
            submittedAt: new Date(),
            publishedAt: new Date(),
          },
          include: { target: true },
        })
      )
    );

    return NextResponse.json({
      message: `Profile submitted to ${submissions.length} site${submissions.length === 1 ? '' : 's'}.`,
      submissions: submissions.map((s) => ({
        id: s.id,
        target: s.target.name,
        status: s.status,
        publishedAt: s.publishedAt,
      })),
    });
  } catch (error) {
    console.error('Cross-post submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}