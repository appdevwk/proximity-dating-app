import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { targetId } = body as { targetId?: string };

    if (!targetId) {
      return NextResponse.json({ error: 'Target site ID is required' }, { status: 400 });
    }

    const subscription = await db.crossPostSubscription.findFirst({
      where: { userId: session.id, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      include: { plan: true, targetLinks: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription. Subscribe to a plan first.' }, { status: 402 });
    }

    const target = await db.crossPostTarget.findUnique({ where: { id: targetId } });
    if (!target || !target.active) {
      return NextResponse.json({ error: 'Target site not found' }, { status: 404 });
    }

    const alreadyActive = subscription.targetLinks.some((st) => st.targetId === target.id);

    if (alreadyActive) {
      // Deactivate
      await db.crossPostSubscriptionTarget.delete({
        where: { subscriptionId_targetId: { subscriptionId: subscription.id, targetId: target.id } },
      });
      return NextResponse.json({ message: 'Site deactivated', active: false, target: { id: target.id, name: target.name } });
    }

    // Activate — enforce plan site limit
    if (subscription.targetLinks.length >= subscription.plan.maxSites) {
      return NextResponse.json(
        {
          error: `Your ${subscription.plan.name} plan allows ${subscription.plan.maxSites} sites. Upgrade to the Mega Package for more.`,
        },
        { status: 422 }
      );
    }

    await db.crossPostSubscriptionTarget.create({
      data: {
        subscriptionId: subscription.id,
        targetId: target.id,
      },
    });

    return NextResponse.json({ message: 'Site activated', active: true, target: { id: target.id, name: target.name } });
  } catch (error) {
    console.error('Activate cross-post site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}