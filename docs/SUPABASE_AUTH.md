# Supabase Auth — TinyScribble (6-digit OTP)

Aligned with **PROJECT_SCOPE §3.9**: passwordless only, no passwords; pre-checkout stays anonymous; Stripe Checkout can still collect email for billing (link accounts in webhook when needed).

## Dashboard checklist

1. **Authentication → Providers → Email**
   - Enable **Email**.
   - Turn **off** “Confirm email” for faster dev if you want (production: usually keep confirmations).
   - Disable **password** sign-in if the UI offers it (scope: OTP only).

2. **Authentication → Email Templates → Magic Link**
   - Replace the default template with one that shows the **6-digit code** instead of a link.
   - Include `{{ .Token }}` in the body so users receive the code:
   ```html
   <h2>Your TinyScribble sign-in code</h2>
   <p>Enter this 6-digit code in the app:</p>
   <p style="font-size:24px;font-weight:bold;letter-spacing:0.2em;">{{ .Token }}</p>
   <p>This code expires in 1 hour.</p>
   ```

3. **Authentication → URL configuration**
   - **Site URL:** e.g. `https://your-domain.com` (prod) or `http://localhost:3000` (dev).
   - **Redirect URLs** (allowlist) — add:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**` (optional wildcard for dev)
     - `https://your-domain.com/auth/callback`
     - `https://your-domain.com/**` (optional)

4. **Session length (30-day retention, per scope)**  
   Adjust under **Authentication → Settings** (JWT expiry, refresh token rotation). Longer-lived refresh sessions approximate “30-day retention”; tune to product/legal needs.

## App routes

| Route | Role |
|-------|------|
| `/login` | Collect email → `signInWithOtp` (sends 6-digit code) → user enters code → `verifyOtp`. **If already signed in**, server redirects to `next` or **`/dashboard`** (no more “logged in but still on login”). Use **`/login?switch_account=1`** to sign out and use another email. |
| `/auth/callback` | Legacy: PKCE `exchangeCodeForSession` for old magic links (if template still sends links). Not used for OTP flow. |

## Env (see `.env.example`)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

## Code layout

- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`).
- `src/lib/supabase/server.ts` — server client (`cookies()`).
- `src/lib/supabase/middleware.ts` + `src/middleware.ts` — refresh session on navigation.
- Paywall checkout passes `supabaseUserId` when the user is already signed in.

## After Stripe Checkout (implemented)

1. **Success URL** → `/checkout/success?session_id={CHECKOUT_SESSION_ID}` (set in `POST /api/stripe/checkout`).
2. **Success page** explains that the user must use the **same email as Stripe** to sign in, and offers:
   - **Continue** → `GET /api/auth/complete-checkout?session_id=…` → verifies Stripe session, syncs billing → redirects to `/login?next=/generate&email=…&auto_send=1` (code is sent automatically; user enters 6-digit code).
   - **Go to login** → `/login?next=/generate&email=…` for manual sign-in.
3. **Webhooks** (Stripe Dashboard → Developers → Webhooks → your endpoint) — enable at least:
   - `checkout.session.completed` — upsert into **`billing_customers`**
   - **`customer.subscription.created`** and **`customer.subscription.updated`** — keeps **`status`** in sync (e.g. `incomplete` → **`trialing`**). Without these, trial users can look “unpaid” until something else updates the row.
4. **If `billing_customers` stays empty** — webhooks never reached your server (localhost, wrong URL, missing `STRIPE_WEBHOOK_SECRET`, or `SUPABASE_SERVICE_ROLE_KEY` unset). The app **also** upserts the same row when:
   - **`GET /api/stripe/checkout-session`** runs (success page load), and
   - **`GET /api/auth/complete-checkout`** runs (**Continue** after checkout).  
   Both need **`SUPABASE_SERVICE_ROLE_KEY`** and the **`001`** migration applied. Re-run a test checkout or open `/checkout/success?session_id=cs_…` once to trigger sync.
5. **Migrations** (SQL editor or `supabase db push`):
   - `001_billing_customers.sql` — base table + RLS on email
   - `002_billing_customers_auth_user_id.sql` — **`auth_user_id`** + RLS so a row matches **`auth.uid()`** even if Stripe email ≠ login email (metadata `supabase_user_id` on Customer)
6. **Paid / trial state in the app** — `GET /api/billing/entitlement` reads `billing_customers` (RLS). **`trialing`**, **`active`**, and **`past_due`** count as entitled (e.g. Create video → `/generate/video`, not paywall).

## Session transfer (still TODO)

Scope: *Generated image transferred to new account.*  
Do in webhook or a post-login job: attach anonymous upload session to `user_id` once identified.
