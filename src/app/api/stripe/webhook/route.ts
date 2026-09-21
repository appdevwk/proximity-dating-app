import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import { sendEmail, receiptEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = getStripeWebhookSecret();

  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkout = event.data.object as Stripe.Checkout.Session;
        const userId = checkout.metadata?.userId ?? checkout.client_reference_id;
        const planId = checkout.metadata?.planId;
        const stripeSubId = typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription?.id;
        const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id;

        if (!userId || !planId) {
          return NextResponse.json({ error: 'Missing metadata on session' }, { status: 400 });
        }

        // Refetch the subscription to confirm payment was collected.
        let paid = true;
        if (checkout.payment_status === 'unpaid' || checkout.payment_status === 'no_payment_required') {
          paid = false;
        }

        await activateSubscription(userId, planId, customerId ?? null, stripeSubId ?? null, paid);
        return NextResponse.json({ received: true });
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;
        const status = sub.status;

        const dbSub = await db.crossPostSubscription.findFirst({
          where: { stripeSubId },
        });

        if (!dbSub) {
          return NextResponse.json({ received: true });
        }

        const mapped = mapStripeStatus(status);
        if (mapped) {
          await db.crossPostSubscription.update({
            where: { id: dbSub.id },
            data: { status: mapped },
          });
        }
        return NextResponse.json({ received: true });
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as unknown as { subscription?: string | null }).subscription ?? undefined;

        if (stripeSubId && invoice.amount_paid) {
          const dbSub = await db.crossPostSubscription.findFirst({
            where: { stripeSubId },
          });
          if (dbSub) {
            await db.crossPostSubscription.update({
              where: { id: dbSub.id },
              data: { status: 'ACTIVE' },
            });
            await db.payment.create({
              data: {
                userId: dbSub.userId,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency?.toUpperCase() ?? 'USD',
                status: 'COMPLETED',
                provider: 'STRIPE',
                description: `Cross-post renewal (${dbSub.id})`,
                metadata: JSON.stringify({ stripeInvoiceId: invoice.id, stripeSubId }),
              },
            });
          }
        }
        return NextResponse.json({ received: true });
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as unknown as { subscription?: string | null }).subscription ?? undefined;
        if (stripeSubId) {
          await db.crossPostSubscription.updateMany({
            where: { stripeSubId },
            data: { status: 'PAST_DUE' },
          });
        }
        return NextResponse.json({ received: true });
      }

      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | null {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      return 'CANCELED';
    default:
      return null;
  }
}

async function activateSubscription(
  userId: string,
  planId: string,
  customerId: string | null,
  stripeSubId: string | null,
  paid: boolean
) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const existing = await db.crossPostSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
  });
  if (existing && existing.planId !== planId) {
    await db.crossPostSubscription.update({
      where: { id: existing.id },
      data: { status: 'CANCELED', endDate: new Date() },
    });
  }

  const data = {
    status: paid ? ('ACTIVE' as const) : ('PAST_DUE' as const),
    provider: 'STRIPE',
    stripeCustomerId: customerId,
    stripeSubId,
    startDate,
    endDate,
    autoRenew: true,
  };

  const subscription = await db.crossPostSubscription.upsert({
    where: { userId_planId: { userId, planId } },
    update: data,
    create: {
      userId,
      planId,
      ...data,
    },
  });

  if (paid) {
    const plan = await db.crossPostPlan.findUnique({ where: { id: planId } });
    await db.payment.create({
      data: {
        userId,
        amount: plan?.price ?? 0,
        currency: plan?.currency ?? 'USD',
        status: 'COMPLETED',
        provider: 'STRIPE',
        description: `Cross-post: ${plan?.name ?? 'Subscription'} (Stripe)`,
        metadata: JSON.stringify({ subscriptionId: subscription.id, planId }),
      },
    });

    const recipient = await db.user.findUnique({ where: { id: userId } });
    if (recipient?.email) {
      void sendEmail({
        to: recipient.email,
        subject: `Your ${plan?.name ?? 'subscription'} is active`,
        html: receiptEmail(
          recipient.name ?? 'friend',
          plan?.name ?? 'Monthly subscription',
          (plan?.price ?? 0).toFixed(2),
          plan?.currency ?? 'USD'
        ),
      }).catch(() => {});
    }
  }
}