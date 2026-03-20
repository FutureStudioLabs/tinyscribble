# TinyScribble — Third-party integrations

**Last updated:** March 2026  
**Source:** Product / engineering handoff (Yanick)

---

## Image & video generation — APIYI

| Item | Detail |
|------|--------|
| **Canonical doc** | **[`docs/APIYI_INTEGRATION_BRIEF.md`](./APIYI_INTEGRATION_BRIEF.md)** — models, prompts, flows, Sentry checklist |
| **Public docs** | [https://docs.apiyi.com/en](https://docs.apiyi.com/en) |
| **Base URL** | `https://api.apiyi.com` · backup `https://vip.apiyi.com` |
| **Auth** | `Authorization: Bearer <APIYI_API_KEY>` (OpenAI-compatible) |
| **Image** | `POST /v1/chat/completions` · model **`nano-banana`** · ~$0.02 · 45–60s · JSON + drawing **public R2 URL** |
| **Video** | `POST /v1/videos` (multipart) · **`veo-3.1-fast-fl`** · ~$0.15 · async poll + content URL · **24h URL → must re-upload to R2** |
| **Onboarding** | **3 images in parallel** (`Promise.all`) — same prompt; `image_url_1/2/3` + `image_accepted` in Supabase |
| **Paywall** | Image generation is **before** paywall (cost absorbed); video after Stripe |

**Env (server-only — no `NEXT_PUBLIC_` for APIYI):**

```env
APIYI_API_KEY=
APIYI_BASE_URL=https://api.apiyi.com
APIYI_IMAGE_MODEL=nano-banana
APIYI_VIDEO_MODEL=veo-3.1-fast-fl
```

---

## Analytics — PostHog

| Item | Detail |
|------|--------|
| **Provider** | PostHog |
| **Use** | Product analytics, funnels, events (see `PROJECT_SCOPE.md` §5) |

```env
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Error monitoring — Sentry

| Item | Detail |
|------|--------|
| **Provider** | Sentry |
| **Use** | Crash / error monitoring |
| **Requirement** | **Verify Sentry receives a test error in each environment before marking integration “done”.** Error monitoring is critical. |
| **Setup** | `npx @sentry/wizard@latest -i nextjs` — see **`APIYI_INTEGRATION_BRIEF.md` §7** for manual captures (`sessionId` in `extra`) |

```env
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Payments — Stripe

| Item | Detail |
|------|--------|
| **Access** | Developer invite sent to engineering email |
| **Sandbox** | Test keys in 1Password / team vault — **never commit keys to git** |
| **Client handoff** | **[`docs/STRIPE_CLIENT_HANDOFF.md`](./STRIPE_CLIENT_HANDOFF.md)** — Yanick’s sandbox products + metadata rule |
| **Checkout** | Hosted Checkout (see `PROJECT_SCOPE.md` §3.5) |

### Products (sandbox configured with 3 products)

#### 1. TinyScribble Starter (default / first purchase)

| Price | Notes |
|-------|--------|
| **$8.99/mo** | Monthly anchor |
| **$47.99/yr** | Shown as **$3.99/mo** (regular annual) |
| **$35.99/yr** | Shown as **$2.99/mo** — **exit promo only** (e.g. exit-intent screen) |

- **3-day trial:** Implemented in **application code** (`trial_period_days: 3`), **not** as a Stripe product trial configuration on Starter.

#### 2. TinyScribble Family (upgrade only)

| Price | Notes |
|-------|--------|
| **$89.99/yr** | Shown as **$6.99/mo** |
| **Upsell** | After subscribed user hits usage limits |
| **Quota** | **6 videos / month** |
| **Trial** | **None** |

#### 3. TinyScribble Power (upgrade only)

| Price | Notes |
|-------|--------|
| **$119.99/yr** | Shown as **$9.99/mo** |
| **Upsell** | Tier above Family |
| **Quota** | **10 videos / month** |
| **Trial** | **None** |

Family and Power are **not** shown as initial plan choices; they appear as upgrades when applicable.

### Stripe customer metadata (required)

Tag every Stripe **Customer** with the Supabase user id:

```javascript
metadata: {
  supabase_user_id: "<uuid>"
}
```

This keeps billing ↔ auth alignment for support, migrations, and webhooks.

### Env placeholders

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Price IDs from Stripe Dashboard (Starter monthly / annual / exit annual, Family, Power)
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_STARTER_EXIT_ANNUAL=
STRIPE_PRICE_FAMILY_ANNUAL=
STRIPE_PRICE_POWER_ANNUAL=
```

---

## Supabase

| Variable | Use |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser / user-scoped requests with RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — full DB access, webhooks, admin. |
| `SUPABASE_SECRET_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | New dashboard key shapes; use if your SDK version requires them. |
| `SUPABASE_ACCESS_TOKEN` (`sbp_...`) | **Personal access token** — Management API, CLI, automation. **Not** for `createClient()` PostgREST queries; use service role on the server for that. |

App database reads/writes use **`@supabase/supabase-js`** (or `@supabase/ssr` in Next.js) with **URL + anon** (client) or **URL + service role** (server). The `sbp_` token is for account-level tooling, not row data in the app unless you explicitly call the Management API.

**Magic link auth (implemented):** see **[`docs/SUPABASE_AUTH.md`](./SUPABASE_AUTH.md)** — `/login`, `/auth/callback`, middleware session refresh, Stripe `supabaseUserId` when logged in.

---

## Storage — Cloudflare R2

See root `.env.example` for `R2_*` variables.

---

*TinyScribble integrations reference*
