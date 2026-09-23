import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getStripe, ensureStripePrice } from '@/lib/stripe';
import { sendEmail, receiptEmail } from '@/lib/email';

export const runtime = 'nodejs';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
  (process.env.NODE_ENV === 'production'
    ? 'https://proximitygetadate.site'
    : 'http://localhost:3000');

export async function POST(request: NextRequest) {
  try {
    // Resolve the base URL from the actual request origin so checkout
    // redirects/return URLs always point at the domain the user is on
    // (the parked NEXT_PUBLIC_APP_URL domain is not routed to Vercel yet).
    const origin = new URL(request.url).origin;
    const baseUrl =
      origin && !origin.includes('localhost')
        ? origin
        : BASE_URL;

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planId, mode } = body as { planId?: string; mode?: string };

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Fall back to the ad-credits flow so subscriptions still work before Stripe is configured.
      const activated = await activateWithAdCredits(session.id, planId);
      if (!activated) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      return NextResponse.json({ activated: true });
    }

    const plan = await db.crossPostPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const { priceId } = await ensureStripePrice(plan);
    await db.crossPostPlan.update({
      where: { id: plan.id },
      data: { stripePriceId: priceId },
    });

    // Reuse the user's Stripe customer if we already have one.
    let customerId: string | null = null;
    const existing = await db.crossPostSubscription.findFirst({
      where: { userId: session.id, stripeCustomerId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { stripeCustomerId: true },
    });
    if (existing?.stripeCustomerId) {
      customerId = existing.stripeCustomerId;
    } else {
      const email = session.email ?? `${session.id}@proximitygetadate.site`;
      const customer = await stripe.customers.create({
        email,
        name: session.name ?? undefined,
        metadata: { userId: session.id },
      });
      customerId = customer.id;
    }

    const embedded = mode === 'embedded';

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(embedded
        ? {
            ui_mode: 'embedded_page',
            return_url: `${baseUrl}/subscribe?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          }
        : {
            success_url: `${baseUrl}/subscribe?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/subscribe?checkout=cancelled`,
          }),
      client_reference_id: session.id,
      metadata: { userId: session.id, planId: plan.id },
      subscription_data: {
        metadata: { userId: session.id, planId: plan.id },
      },
    });

    if (embedded) {
      return NextResponse.json({ clientSecret: checkout.client_secret ?? null });
    }
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}

async function activateWithAdCredits(userId: string, planId: string): Promise<boolean> {
  const plan = await db.crossPostPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) {
    return false;
  }

  await db.crossPostSubscription.updateMany({
    where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
    data: { status: 'CANCELED', endDate: new Date() },
  });

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  await db.crossPostSubscription.upsert({
    where: { userId_planId: { userId, planId: plan.id } },
    update: {
      status: 'ACTIVE',
      provider: 'AD_CREDITS',
      startDate,
      endDate,
      autoRenew: true,
    },
    create: {
      userId,
      planId: plan.id,
      status: 'ACTIVE',
      provider: 'AD_CREDITS',
      startDate,
      endDate,
      autoRenew: true,
    },
  });

  await db.payment.create({
    data: {
      userId,
      amount: plan.price,
      currency: plan.currency ?? 'USD',
      status: 'COMPLETED',
      provider: 'AD_CREDITS',
      description: `Cross-post: ${plan.name} (${plan.slug})`,
      metadata: JSON.stringify({ planId: plan.id }),
    },
  });

  const recipient = await db.user.findUnique({ where: { id: userId } });
  if (recipient?.email) {
    void sendEmail({
      to: recipient.email,
      subject: `Your ${plan.name} plan is active`,
      html: receiptEmail(recipient.name ?? 'friend', plan.name, plan.price.toFixed(2), plan.currency ?? 'USD'),
    }).catch(() => {});
  }

  return true;
}