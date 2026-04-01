import { syncPaidTierUpgradeBonusesFromStripeSubscription } from "@/lib/plan-upgrade-bonus";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseAuthUserIdFromStripeMetadata(
  raw: string | undefined | null
): string | null {
  const s = raw?.trim();
  if (!s || !UUID_RE.test(s)) return null;
  return s;
}

/**
 * Upsert `billing_customers` (service role). Used by Stripe webhooks and checkout success paths
 * so the table fills even when webhooks are not configured (e.g. local dev).
 */
export async function upsertBillingCustomer(args: {
  email: string;
  customerId: string;
  subscriptionId: string | null;
  status: string;
  authUserId: string | null;
}): Promise<void> {
  const { email, customerId, subscriptionId, status, authUserId } = args;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  try {
    const admin = createAdminClient();

    let authUserIdToStore = authUserId;
    if (!authUserIdToStore) {
      const { data: existing } = await admin
        .from("billing_customers")
        .select("auth_user_id")
        .eq("email", normalizedEmail)
        .maybeSingle();
      const existingId = existing?.auth_user_id as string | null | undefined;
      if (existingId) authUserIdToStore = String(existingId);
    }

    const row: Record<string, string | null> = {
      email: normalizedEmail,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status,
      updated_at: new Date().toISOString(),
    };
    if (authUserIdToStore) {
      row.auth_user_id = authUserIdToStore;
    }

    const { error: upsertError } = await admin
      .from("billing_customers")
      .upsert(row, { onConflict: "email" });

    if (upsertError) {
      console.error("billing_customers upsert", upsertError);
    }
  } catch (err) {
    console.error("billing sync skipped (SUPABASE_SERVICE_ROLE_KEY or table missing?)", err);
  }
}

/**
 * Sync from a completed Checkout Session (subscription mode). Safe to call multiple times.
 */
/**
 * First time a subscription becomes paid after trial: exclude pre-conversion gallery usage
 * from Starter monthly video/scene limits. Idempotent (only sets when column is null).
 */
export async function setPaidQuotaResetAtIfNullForEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  try {
    const admin = createAdminClient();
    const { data: existing, error: selErr } = await admin
      .from("billing_customers")
      .select("paid_quota_reset_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selErr) {
      console.error("billing_customers paid_quota_reset_at select", selErr);
      return;
    }
    if (existing?.paid_quota_reset_at) return;

    const at = new Date().toISOString();
    const { error: updErr } = await admin
      .from("billing_customers")
      .update({ paid_quota_reset_at: at })
      .eq("email", normalizedEmail)
      .is("paid_quota_reset_at", null);

    if (updErr) {
      console.error("billing_customers paid_quota_reset_at update", updErr);
    }
  } catch (err) {
    console.error("setPaidQuotaResetAtIfNullForEmail", err);
  }
}

export async function syncBillingFromCheckoutSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<void> {
  const supabaseUserIdRaw =
    session.metadata?.supabase_user_id?.trim() ||
    session.client_reference_id?.trim() ||
    "";
  const authUserId = parseAuthUserIdFromStripeMetadata(supabaseUserIdRaw);

  const customerRaw = session.customer;
  const customerId =
    typeof customerRaw === "string"
      ? customerRaw
      : customerRaw && typeof customerRaw === "object" && "id" in customerRaw
        ? (customerRaw as { id: string }).id
        : undefined;

  if (customerId && authUserId) {
    try {
      await stripe.customers.update(customerId, {
        metadata: { supabase_user_id: authUserId },
      });
    } catch (err) {
      console.error("stripe customer metadata update failed", err);
    }
  }

  const email = (
    session.customer_details?.email ||
    session.customer_email ||
    ""
  )
    .trim()
    .toLowerCase();

  let subscriptionId: string | null = null;
  let subscriptionStatus = "incomplete";
  const rawSub = session.subscription;
  if (typeof rawSub === "string") {
    subscriptionId = rawSub;
  } else if (rawSub && typeof rawSub === "object" && "id" in rawSub) {
    const sub = rawSub as Stripe.Subscription;
    subscriptionId = sub.id;
    subscriptionStatus = sub.status;
  }

  if (subscriptionId && subscriptionStatus === "incomplete") {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      subscriptionStatus = sub.status;
    } catch (err) {
      console.error("subscription retrieve failed", err);
    }
  }

  if (email && customerId) {
    await upsertBillingCustomer({
      email,
      customerId,
      subscriptionId,
      status: subscriptionStatus,
      authUserId,
    });
  }

  if (email && subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });
      await syncPaidTierUpgradeBonusesFromStripeSubscription(email, sub);
    } catch (err) {
      console.error("plan upgrade bonus after checkout session", err);
    }
  }
}
