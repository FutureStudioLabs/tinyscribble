import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "TinyScribble <no-reply@tinyscribble.com>";

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
