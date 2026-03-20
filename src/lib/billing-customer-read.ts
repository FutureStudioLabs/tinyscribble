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
