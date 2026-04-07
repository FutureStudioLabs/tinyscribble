import { Resend } from "resend";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }
  return new Resend(key);
}

const FROM = "TinyScribble <no-reply@tinyscribble.com>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/*  Trial Ending Reminder                                              */
/* ------------------------------------------------------------------ */

export interface TrialReminderParams {
  to: string;
  firstName: string;
  trialEndDate: string;
  trialEndTime: string;
  priceLine: string;
}

export async function sendTrialEndingReminder({
  to,
  firstName,
  trialEndDate,
  trialEndTime,
  priceLine,
}: TrialReminderParams) {
  const resend = getResendClient();
  if (!resend) return;

  const subject = `Your free trial ends tomorrow`;

  const text = `Hi ${firstName},

Just a heads up — your free trial ends tomorrow, ${trialEndDate} at ${trialEndTime}.

After that, your plan continues automatically at ${priceLine}. No action needed if you'd like to keep your Memory Book and continue creating magical videos from your little one's drawings.

If you'd like to cancel before being charged, you can do so anytime from your account settings.

Questions? Just reply to this email.
— The TinyScribble Team`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a; line-height: 1.6;">
  <p>Hi ${escapeHtml(firstName)},</p>

  <p>Just a heads up &mdash; your free trial ends tomorrow, <strong>${escapeHtml(trialEndDate)}</strong> at <strong>${escapeHtml(trialEndTime)}</strong>.</p>

  <p>After that, your plan continues automatically at <strong>${escapeHtml(priceLine)}</strong>. No action needed if you&rsquo;d like to keep your Memory Book and continue creating magical videos from your little one&rsquo;s drawings.</p>

  <p>If you&rsquo;d like to cancel before being charged, you can do so anytime from your <a href="https://tinyscribble.com/dashboard/billing" style="color: #6d28d9;">account settings</a>.</p>

  <p>Questions? Just reply to this email.</p>

  <p>&mdash; The TinyScribble Team</p>
</div>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Video Ready                                                        */
/* ------------------------------------------------------------------ */

export interface VideoReadyParams {
  to: string;
  firstName: string;
}

export async function sendVideoReadyEmail({ to, firstName }: VideoReadyParams) {
  const resend = getResendClient();
  if (!resend) return;

  const subject = "Your video is ready!";

  const text = `Hi ${firstName},

Great news — your TinyScribble video is ready!

Head over to your gallery to watch, download, and share it:
https://tinyscribble.com/dashboard/gallery

We can't wait for you to see the magic.
— The TinyScribble Team`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a; line-height: 1.6;">
  <p>Hi ${escapeHtml(firstName)},</p>

  <p>Great news &mdash; your TinyScribble video is ready! 🎬</p>

  <p>Head over to your <a href="https://tinyscribble.com/dashboard/gallery" style="color: #6d28d9; font-weight: 600;">gallery</a> to watch, download, and share it.</p>

  <p>We can&rsquo;t wait for you to see the magic.</p>

  <p>&mdash; The TinyScribble Team</p>
</div>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed (video-ready): ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Plan Active (trial → paid)                                         */
/* ------------------------------------------------------------------ */

export interface PlanActiveParams {
  to: string;
  firstName: string;
  planLabel: string;
  amountFormatted: string;
  intervalLabel: string;
}

export async function sendPlanActiveEmail({
  to,
  firstName,
  planLabel,
  amountFormatted,
  intervalLabel,
}: PlanActiveParams) {
  const resend = getResendClient();
  if (!resend) return;

  const subject = "Your plan is now active!";

  const text = `Hi ${firstName},

Your free trial has ended and your ${planLabel} plan is now active at ${amountFormatted} ${intervalLabel}.

You now have full access to create videos, build your Memory Book, and turn your little one's drawings into magical animations.

You can manage your plan anytime from your account settings:
https://tinyscribble.com/dashboard/billing

Questions? Just reply to this email.
— The TinyScribble Team`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a; line-height: 1.6;">
  <p>Hi ${escapeHtml(firstName)},</p>

  <p>Your free trial has ended and your <strong>${escapeHtml(planLabel)}</strong> plan is now active at <strong>${escapeHtml(amountFormatted)} ${escapeHtml(intervalLabel)}</strong>.</p>

  <p>You now have full access to create videos, build your Memory Book, and turn your little one&rsquo;s drawings into magical animations.</p>

  <p>You can manage your plan anytime from your <a href="https://tinyscribble.com/dashboard/billing" style="color: #6d28d9;">account settings</a>.</p>

  <p>Questions? Just reply to this email.</p>

  <p>&mdash; The TinyScribble Team</p>
</div>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed (plan-active): ${error.message}`);
  }
}
