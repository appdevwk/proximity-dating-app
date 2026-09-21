import Stripe from 'stripe';

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || /xxxx/i.test(key)) {
    return null;
  }
  return new Stripe(key, { apiVersion: '2026-08-26.dahlia' });
}

export function getStripeWebhookSecret(): string | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || /xxxx/i.test(secret)) {
    return null;
  }
  return secret;
}

export async function ensureStripePrice(plan: {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  stripePriceId?: string | null;
}): Promise<{ priceId: string }> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  if (plan.stripePriceId) {
    try {
      const existing = await stripe.prices.retrieve(plan.stripePriceId);
      if (existing.active) {
        return { priceId: plan.stripePriceId };
      }
    } catch {
      // Fall through and create a fresh price.
    }
  }

  const product = await stripe.products.create({
    name: `Cross-Post ${plan.name}`,
    metadata: { planId: plan.id, planSlug: plan.slug },
    tax_code: 'txcd_10000000',
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(plan.price * 100),
    currency: plan.currency.toLowerCase(),
    recurring: { interval: 'month' },
    metadata: { planId: plan.id, planSlug: plan.slug },
  });

  return { priceId: price.id };
}