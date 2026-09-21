import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const revalidate = 0;

const FALLBACK_PLANS = [
  {
    name: 'Standard',
    slug: 'standard-4.99',
    price: 4.99,
    maxSites: 3,
    description: 'Cross-post your profile to 3 partner sites for just $4.99/month.',
    sortOrder: 1,
  },
  {
    name: 'Mega Package',
    slug: 'mega-19.95',
    price: 19.95,
    maxSites: 8,
    description: 'The full reach. Cross-post your profile to ALL partner sites for $19.95/month.',
    sortOrder: 2,
  },
];

export async function GET() {
  try {
    const session = await getSessionUser();

    const [plans, targets] = await Promise.all([
      db.crossPostPlan.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.crossPostTarget.findMany({
        where: { active: true },
        orderBy: { popular: 'desc' },
      }),
    ]);

    // Seed default plans/targets if the DB is fresh.
    const effectivePlans =
      plans.length > 0
        ? plans
        : await Promise.all(
            FALLBACK_PLANS.map((plan) =>
              db.crossPostPlan.upsert({
                where: { slug: plan.slug },
                update: {
                  name: plan.name,
                  price: plan.price,
                  maxSites: plan.maxSites,
                  description: plan.description,
                  sortOrder: plan.sortOrder,
                },
                create: {
                  name: plan.name,
                  slug: plan.slug,
                  price: plan.price,
                  maxSites: plan.maxSites,
                  description: plan.description,
                  sortOrder: plan.sortOrder,
                },
              })
            )
          );

    const effectiveTargets =
      targets.length > 0
        ? targets
        : await Promise.all(
            [
              { name: 'AdultFriendFinder', slug: 'adultfriendfinder', popular: true },
              { name: 'Ashley Madison', slug: 'ashleymadison' },
              { name: 'OkCupid', slug: 'okcupid', popular: true },
              { name: 'Match.com', slug: 'match' },
              { name: 'POF', slug: 'pof' },
              { name: 'Zoosk', slug: 'zoosk' },
              { name: 'Badoo', slug: 'badoo' },
              { name: 'eHarmony', slug: 'eharmony' },
            ].map((target) =>
              db.crossPostTarget.upsert({
                where: { slug: target.slug },
                update: { name: target.name, popular: target.popular ?? false },
                create: { name: target.name, slug: target.slug, popular: target.popular ?? false },
              })
            )
          );

    let subscription: {
    id: string;
    status: string;
    provider: string;
    startDate: Date;
    endDate: Date | null;
    plan: { id: string; name: string; slug: string; price: number; maxSites: number };
    targetLinks: { target: { id: string; name: string; slug: string } }[];
  } | null = null;
    if (session) {
      subscription = await db.crossPostSubscription.findFirst({
        where: { userId: session.id, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        include: { plan: true, targetLinks: { include: { target: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      plans: effectivePlans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        currency: p.currency,
        interval: p.interval,
        maxSites: p.maxSites,
        description: p.description,
      })),
      targets: effectiveTargets.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        popular: t.popular,
      })),
      subscription: subscription
        ? {
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
              maxSites: subscription.plan.maxSites,
            },
            targets: subscription.targetLinks.map((st) => ({
              id: st.target.id,
              name: st.target.name,
              slug: st.target.slug,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Get cross-post catalog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planId } = body as { planId?: string };

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = await db.crossPostPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Cancel any existing active subscription first (single active subscription per user).
    await db.crossPostSubscription.updateMany({
      where: { userId: session.id, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      data: { status: 'CANCELED', endDate: new Date() },
    });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await db.crossPostSubscription.upsert({
      where: { userId_planId: { userId: session.id, planId: plan.id } },
      update: {
        status: 'ACTIVE',
        provider: 'AD_CREDITS',
        startDate,
        endDate,
        autoRenew: true,
      },
      create: {
        userId: session.id,
        planId: plan.id,
        status: 'ACTIVE',
        provider: 'AD_CREDITS',
        startDate,
        endDate,
        autoRenew: true,
      },
      include: { plan: true },
    });

    // Record the payment (billed in ad credits for now).
    await db.payment.create({
      data: {
        userId: session.id,
        amount: plan.price,
        currency: plan.currency ?? 'USD',
        status: 'COMPLETED',
        provider: 'AD_CREDITS',
        description: `Cross-post: ${plan.name} (${plan.slug})`,
        metadata: JSON.stringify({ subscriptionId: subscription.id, planId: plan.id }),
      },
    });

    return NextResponse.json({
      message: 'Subscription activated',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: subscription.plan.price,
          maxSites: subscription.plan.maxSites,
        },
      },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}