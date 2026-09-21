-- AlterTable
ALTER TABLE "cross_post_plans" ADD COLUMN     "stripePriceId" TEXT;

-- AlterTable
ALTER TABLE "cross_post_subscriptions" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubId" TEXT;
