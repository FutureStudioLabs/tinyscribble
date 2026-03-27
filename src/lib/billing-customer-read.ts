import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Load subscription status from `billing_customers` using the same rules as RLS:
 * row visible when `auth_user_id = auth.uid()` or `lower(email)` matches JWT email.
 *
 * We query by `auth_user_id` first (reliable after checkout metadata), then by email,
 * so we don't rely on an unfiltered `.select().maybeSingle()` across visible rows.
 */
export async function fetchBillingCustomerStatusForUser(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "email">
): Promise<{ status: string | null; errorMessage: string | null }> {
  const { data: byUserId, error: errUserId } = await supabase
    .from("billing_customers")
    .select("status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errUserId) {
    return { status: null, errorMessage: errUserId.message };
  }
  if (byUserId?.status != null && String(byUserId.status).trim() !== "") {
    return { status: String(byUserId.status).trim(), errorMessage: null };
  }

  const emailLower = user.email?.trim().toLowerCase() ?? "";
  if (!emailLower) {
    return { status: null, errorMessage: null };
  }

  const { data: byEmail, error: errEmail } = await supabase
    .from("billing_customers")
    .select("status")
    .eq("email", emailLower)
    .maybeSingle();

  if (errEmail) {
    return { status: null, errorMessage: errEmail.message };
  }
  if (byEmail?.status != null && String(byEmail.status).trim() !== "") {
    return { status: String(byEmail.status).trim(), errorMessage: null };
  }

  return { status: null, errorMessage: null };
}

export type BillingCustomerStripeRow = {
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  /** When set, paid monthly quotas count only gallery rows after this instant (trial → Starter). */
  paid_quota_reset_at: string | null;
};

/**
 * Subscription + customer ids for Stripe server calls (RLS: same visibility as status).
 */
export async function fetchBillingCustomerStripeRowForUser(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "email">
): Promise<{ row: BillingCustomerStripeRow | null; errorMessage: string | null }> {
  const { data: byUserId, error: errUserId } = await supabase
    .from("billing_customers")
    .select("status, stripe_subscription_id, stripe_customer_id, paid_quota_reset_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errUserId) {
    return { row: null, errorMessage: errUserId.message };
  }
  if (byUserId?.status != null && String(byUserId.status).trim() !== "") {
    return {
      row: {
        status: String(byUserId.status).trim(),
        stripe_subscription_id: byUserId.stripe_subscription_id
          ? String(byUserId.stripe_subscription_id).trim()
          : null,
        stripe_customer_id: byUserId.stripe_customer_id
          ? String(byUserId.stripe_customer_id).trim()
          : null,
        paid_quota_reset_at:
          typeof byUserId.paid_quota_reset_at === "string"
            ? byUserId.paid_quota_reset_at
            : null,
      },
      errorMessage: null,
    };
  }

  const emailLower = user.email?.trim().toLowerCase() ?? "";
  if (!emailLower) {
    return { row: null, errorMessage: null };
  }

  const { data: byEmail, error: errEmail } = await supabase
    .from("billing_customers")
    .select("status, stripe_subscription_id, stripe_customer_id, paid_quota_reset_at")
    .eq("email", emailLower)
    .maybeSingle();

  if (errEmail) {
    return { row: null, errorMessage: errEmail.message };
  }
  if (byEmail?.status != null && String(byEmail.status).trim() !== "") {
    return {
      row: {
        status: String(byEmail.status).trim(),
        stripe_subscription_id: byEmail.stripe_subscription_id
          ? String(byEmail.stripe_subscription_id).trim()
          : null,
        stripe_customer_id: byEmail.stripe_customer_id
          ? String(byEmail.stripe_customer_id).trim()
          : null,
        paid_quota_reset_at:
          typeof byEmail.paid_quota_reset_at === "string"
            ? byEmail.paid_quota_reset_at
            : null,
      },
      errorMessage: null,
    };
  }

  return { row: null, errorMessage: null };
}
