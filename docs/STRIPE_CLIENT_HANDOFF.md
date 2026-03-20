# Stripe — client handoff (Yanick)

**Date:** 18 Mar 2026  
**Environment:** **Sandbox** (test mode)

> **Secrets:** Publishable + secret keys are shared by the client via your team channel.  
> Put them **only** in **`.env.local`** (never commit — root `.gitignore` ignores `.env*` except `.env.example`).

## Keys you should have

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` — safe for client bundle |
| `STRIPE_SECRET_KEY` | `sk_test_...` — **server only** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — create when you add the webhook endpoint (Stripe Dashboard or Stripe CLI); not always in the first handoff |

If a secret key is ever pasted in chat, email, or a ticket, **roll it** in [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys) and update `.env.local`.

### Customer Billing Portal (Restore)

The paywall **Restore** button opens Stripe’s **Customer portal** after the user enters the email used at Checkout.

1. In [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal), **activate** the portal and choose allowed actions (cancel, update payment method, etc.).
2. Without this, `/api/stripe/billing-portal` will error until the portal is configured.

## Products (sandbox — all 3 ready)

### 1. TinyScribble Starter (first purchase / paywall)

| Price | Role |
|-------|------|
| **$8.99/mo** | Monthly anchor |
| **$47.99/yr** | Shown in UI as **$3.99/mo** (regular annual) |
| **$35.99/yr** | Shown as **$2.99/mo** — **exit promo only** (separate screen) |

- **3-day trial:** implement in **code** (`trial_period_days: 3`, etc.) — **not** as trial on the Stripe product for Starter.

### 2. TinyScribble Family (upgrade only)

- **$89.99/yr** — show as **$6.99/mo**
- **6 videos / month**
- **No trial**

### 3. TinyScribble Power (upgrade only)

- **$119.99/yr** — show as **$9.99/mo**
- **10 videos / month**
- **No trial**

Family and Power **do not** appear on the initial paywall; only after a subscribed user hits limits / upgrade path.

## Required: Customer metadata

Every Stripe **Customer** must include:

```js
metadata: {
  supabase_user_id: "<uuid>",
}
```

Use this when creating Checkout sessions / customers so webhooks and support can match **Stripe ↔ Supabase**.

## App env: Price IDs

Copy **Price IDs** (`price_...`) from the Stripe Dashboard for each sandbox price and set in `.env.local`:

- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_ANNUAL`
- `STRIPE_PRICE_STARTER_EXIT_ANNUAL`
- `STRIPE_PRICE_FAMILY_ANNUAL`
- `STRIPE_PRICE_POWER_ANNUAL`

See also: `docs/INTEGRATIONS.md`, `PROJECT_SCOPE.md` §3.5.

## App integration (implemented)

| Piece | Detail |
|-------|--------|
| **Checkout API** | `POST /api/stripe/checkout` with JSON `{ "product": "starter_monthly" \| "starter_annual" \| "starter_exit_annual", "supabaseUserId"?: "<uuid>" }` |
| **Trial paywall CTA** | Maps monthly/yearly selection → `starter_monthly` / `starter_annual` |
| **Exit offer CTA** | `starter_exit_annual` |
| **Trial** | `subscription_data.trial_period_days: 3` on Starter checkouts (not on Stripe product) |
| **Redirects** | Set **`NEXT_PUBLIC_APP_URL`** (prod) so success/cancel URLs are correct; falls back to `VERCEL_URL` / localhost |
| **Success URL** | `/checkout/success?session_id={CHECKOUT_SESSION_ID}` → sign-in flow + `billing_customers` sync via webhook (see `docs/SUPABASE_AUTH.md`) |
| **Webhook** | On `checkout.session.completed`, copies `metadata.supabase_user_id` (or `client_reference_id`) onto the Stripe **Customer** when both are present |
| **Exit offer** | **(1)** **20s idle** on main paywall → `/paywall/exit`. **(2)** Paywall **back** → `/paywall/exit` first. **Close (X)** and **Return to my image** → `/generate`. **Back to trial screen** → `/paywall`. Constants: `src/lib/paywall-exit-offer.ts` |
