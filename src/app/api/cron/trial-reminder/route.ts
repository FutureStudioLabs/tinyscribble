import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrialEndingReminder } from "@/lib/resend";
import { trialReminderPriceLine } from "@/lib/trial-reminder-price-line";
import { subscriptionMainPriceId } from "@/lib/paid-plan-limits";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron — runs daily.
 * Finds users whose Stripe trial ends within the next 28 hours
 * and sends a "trial ending tomorrow" reminder email via Resend.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = createAdminClient();

  const { data: rows, error: dbError } = await supabase
    .from("billing_customers")
    .select("email, stripe_subscription_id, auth_user_id")
    .eq("status", "trialing")
    .is("trial_reminder_sent_at", null);

  if (dbError) {
    console.error("trial-reminder: DB query failed", dbError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ sent: 0, message: "No trialing users pending reminder" });
  }

  const now = Date.now();
  const windowEnd = now + 28 * 60 * 60 * 1000;
  let sent = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      if (!row.stripe_subscription_id) continue;

      const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id, {
        expand: ["items.data.price"],
      });

      if (sub.status !== "trialing" || typeof sub.trial_end !== "number") continue;

      const trialEndMs = sub.trial_end * 1000;

      if (trialEndMs <= now || trialEndMs > windowEnd) continue;

      const trialEndDate = new Date(trialEndMs);
      const dateStr = trialEndDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York",
      });
      const timeStr = trialEndDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
        timeZoneName: "short",
      });

      let firstName = row.email.split("@")[0];
      if (row.auth_user_id) {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(row.auth_user_id);
          const fullName = authData?.user?.user_metadata?.full_name;
          if (typeof fullName === "string" && fullName.trim()) {
            firstName = fullName.trim().split(/\s+/)[0];
          }
        } catch {
          // fall back to email prefix
        }
      }

      const priceId = subscriptionMainPriceId(sub);
      const priceLine = trialReminderPriceLine(priceId ?? "");

      await sendTrialEndingReminder({
        to: row.email,
        firstName,
        trialEndDate: dateStr,
        trialEndTime: timeStr,
        priceLine,
      });

      await supabase
        .from("billing_customers")
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq("email", row.email);

      sent++;
      console.info(`trial-reminder: sent to ${row.email}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`trial-reminder: failed for ${row.email}`, msg);
      errors.push(`${row.email}: ${msg}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined });
}
