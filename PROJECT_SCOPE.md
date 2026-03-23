# TinyScribble — Technical Scope & Architecture

**Version 1.5 · March 2026**  
**Future Studio LLC · Confidential**

> **Integrations detail:** [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) · **APIYI implementation:** [`docs/APIYI_INTEGRATION_BRIEF.md`](docs/APIYI_INTEGRATION_BRIEF.md) (models `nano-banana` / `veo-3.1-fast-fl`, 3× parallel images, prompts, R2, Sentry).

---

## 1. Tech Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js | SSR/ISR, mobile-first web app |
| **Hosting** | Vercel | Deployment, edge functions |
| **Database** | Supabase (PostgreSQL) | User data, sessions, metadata |
| **Auth** | Supabase Auth | Magic link only, no passwords |
| **Storage** | Cloudflare R2 | Images, videos, drawings |
| **Image & video generation** | **[APIYI](https://apiyi.com)** — [docs](https://docs.apiyi.com/en) + [`docs/APIYI_INTEGRATION_BRIEF.md`](docs/APIYI_INTEGRATION_BRIEF.md) | `nano-banana` (3× parallel before paywall) · `veo-3.1-fast-fl` (multipart, async) |
| **Payments** | Stripe (hosted Checkout) | Subscriptions; sandbox + products configured for engineering |
| **Email** | Resend | Magic links, transactional emails |
| **Analytics** | **PostHog** | Event tracking, funnel analysis |
| **Error monitoring** | **Sentry** | Crashes & errors — **must verify with a real test event before calling integration complete** |

### Key Constraints

- **No password auth** — Magic link only
- **No Superwall** — Mobile-only SDK; use Stripe directly
- **No native apps** — Pure web app, mobile-first
- **No "try sample drawing"** — Removed from scope

---

## 2. Design System (Component Spec)

| Element | Specification |
|---------|---------------|
| Button border radius | 999px (fully pill-shaped) |
| Card border radius | 16px |
| Primary button height | 56px minimum (mobile tap target) |
| Primary button style | Full-width, `#1E88E5` background, white text, bold, pill |
| Ghost button style | Transparent, `#1E88E5` border and text |

### Design References

- **remove.bg** — Layout, spacing, upload UX, hero structure
- **Cal AI paywall_sample.png** — Paywall screen design
- **remove.bg stunning_quality** — Before/after slider component
- **remove.bg slider_lander** — Card grid layout
- **remove.bg new_cta** — Closing CTA section

---

## 3. Core Functionalities

### 3.1 Landing Page (`tinyscribble.com`)

| Section | Functionality |
|---------|---------------|
| **Global** | No nav menu, no outgoing links except ToS/Privacy, Login top-right (ghost) |
| **Hero** | Logo, Login, autoplay looping video, headline, subheadline, primary CTA, legal micro-copy |
| **Before/After Slider** | Category tabs (Animals, People, Fantasy, Places, Nature), draggable slider, "See more examples" link |
| **Card Grid** | 2-column grid, 6+ cards, tap opens full-width slider modal |
| **How It Works** | 3-step flow (Upload → Transform → Video) |
| **Testimonials** | 3 placeholder testimonials (replace with real quotes post-launch) |
| **Closing CTA** | "See your child's drawing come to life — try for free" + Upload button |

### 3.2 Upload Flow

| Platform | Behavior |
|----------|----------|
| Mobile | Native share sheet: Photo Library, Take Photo, Choose File |
| Desktop | OS file picker |
| Formats | JPG, PNG, HEIC, WEBP — max 10MB |
| Post-upload | Immediate navigate to loading screen, API call in background (no preview step) |

### 3.3 Loading — Image Generation (45–60s)

| Element | Specification |
|---------|---------------|
| **API** | APIYI `nano-banana` — **3 parallel calls** (`Promise.all`), same R2 drawing URL + prompt; ~45–60s wall time total (see `APIYI_INTEGRATION_BRIEF.md`) |
| **Paywall** | Image step is **before** paywall (per-image cost absorbed) |
| Background | Soft animated gradient (pastel purples/blues) or Coral Dream |
| Drawing preview | Small rounded card, centered, blurred edges |
| Animated icon | Sparkle/wand pulsing |
| Messages | Rotating every 8–10s (6-message sequence) |
| Progress bar | Thin, slow-fill; may track wall time until all 3 complete |
| Error state | >90s or failure: retry, PostHog + Sentry per brief |

### 3.4 Result — Image Preview

| Element | Specification |
|---------|---------------|
| Reveal | Cinematic fade or zoom-in (not instant swap) |
| Before/After Slider | Same drag-handle as landing page; left = original, right = AI result |
| Handle behavior | Auto-animates right→left on load, then center for user |
| Drawing thumbnail | Always visible in corner |
| Primary CTA | "Bring It to Life 🎬" → Stripe paywall |
| **Variants** | **3 CGI images** generated upfront; show image 1 first; "Try another" swaps to 2 or 3 **instantly** (already on R2). Track `image_accepted` (1\|2\|3) in Supabase for video step. PostHog: `image_1_accepted`, `image_2_accepted`, `image_3_accepted` |

### 3.5 Paywall — Stripe Direct

| Element | Specification |
|---------|---------------|
| Layout | Top-to-bottom per Cal AI paywall_sample.png |
| Heading | "Start your 3-day FREE trial." |
| Trial timeline | Vertical timeline: TODAY (lock) → DAY 2 (bell) → DAY 3 (crown) |
| **Starter (initial plans)** | **Monthly $8.99/mo** · **Annual $47.99/yr** shown as **$3.99/mo** (regular annual) |
| **Exit promo (Starter only)** | **$35.99/yr** shown as **$2.99/mo** — only on exit-intent / exit promo surface (see triggers below) |
| **3-day trial** | Apply in **code** via `trial_period_days: 3` — **not** configured on Stripe products for Starter |
| **Family / Power** | **Upgrade-only** after subscribe + usage; **no trial** on these tiers |
| Badges | "3 DAYS FREE", "Best Value" on annual where applicable |
| No Payment line | "✓ No Payment Due Now" — prominent |
| CTA button | "Start Free Trial" — full-width, black (Cal AI style) |
| Stripe type | Hosted Checkout (redirect) |

**Exit offer triggers (main trial paywall → `/paywall/exit`):**

| Trigger | Rule (client) |
|---------|----------------|
| **Idle dwell** | User has **no** pointer / keyboard / touch / scroll (on paywall) for **20 seconds** → navigate to exit offer. Timer resets on any such activity. |
| **Back / leave** | In-app **back** from trial paywall goes to the **exit offer** first (not directly to the result screen). **Close (X)** on the exit offer returns to **`/generate`** (last image). **“Back to trial screen”** returns to the main paywall; **“Return to my image”** also goes to **`/generate`**. |

**Stripe subscription config (Starter):**

```javascript
trial_period_days: 3
payment_behavior: "default_incomplete"
save_default_payment_method: "on_subscription"
```

**Stripe products (sandbox — 3 products):**

| Product | Role | Pricing | Trial | Notes |
|---------|------|---------|-------|--------|
| **TinyScribble Starter** | First purchase | $8.99/mo; $47.99/yr → show **$3.99/mo**; $35.99/yr → show **$2.99/mo** (exit promo only) | 3 days in code | Main paywall |
| **TinyScribble Family** | Upsell | $89.99/yr → show **$6.99/mo** | None | **6 videos/mo** when user hits limits |
| **TinyScribble Power** | Upsell | $119.99/yr → show **$9.99/mo** | None | **10 videos/mo** |

**Customer metadata (required):** Every Stripe Customer must include `metadata: { supabase_user_id: "<uuid>" }` for clean matching, migrations, and webhooks.

### 3.6 Loading — Video Generation (30–60s typical)

| Element | Specification |
|---------|---------------|
| **API** | APIYI **`veo-3.1-fast-fl`** — `multipart/form-data`, async poll, download MP4 → R2 within 24h URL expiry (see brief) |
| Visual | Selected AI image centered, soft particles/sparkles |
| Badge | "🎬 Creating your video…" — pulsing |
| Messages | Rotate every 10s (5-message sequence) |
| Progress bar | Thin; poll every 5–10s; max wait 10 min |
| Background generation | If user leaves: continue on server, email on completion, gallery on return |

### 3.7 Gallery

| Element | Specification |
|---------|---------------|
| Header | Logo left, "Start New Drawing" right |
| Trial banner | Sticky, only after first Skip Trial dismissal |
| Credit indicator | "3 videos left this month" — real-time |
| Cards grid | Newest first, thumbnail + date + play button |
| First visit | Auto-play video full-screen with sound; Download, Share, Create Another |

### 3.8 Trial Lifecycle

| State | Behavior |
|-------|----------|
| **Gallery entry** | `trialing`, card on file, 1 free video used, 5 image limit |
| **Skip Trial modal** | Second video → lightweight modal; "Charge [PLAN PRICE] and continue" or "No thanks" |
| **Sticky banner** | Appears only after first Skip Trial dismissal |
| **Trial reminder** | Email at T+48h with cancellation link |
| **Day 3** | Auto-charge, trial → active |
| **Free images** | 5 during trial; video conversion gated after first free video |

### 3.9 Auth & Email

| Flow | Behavior |
|------|----------|
| Pre-checkout | Anonymous; no account required |
| Stripe checkout | Collects email → creates Supabase account |
| Session transfer | Generated image transferred to new account |
| Login | Magic link only; 30-day token retention |
| Emails | Magic link, video ready, trial reminder, plan active |

---

## 4. Project Scope

### In Scope (v1)

- Landing page (all sections)
- Upload flow (mobile + desktop)
- Image generation (APIyi)
- Result screen with before/after slider
- Stripe paywall (in-house UI, hosted Checkout)
- Video generation (APIyi)
- Gallery with trial banner
- Full trial lifecycle (skip, banner, reminder, expiry)
- Magic link auth
- PostHog analytics (all events)
- Sentry error monitoring (verified with test events)
- Resend transactional emails

### Deferred / Open (v2)

| Item | Status |
|------|--------|
| ~~3 parallel image variations~~ | **In v1** per `APIYI_INTEGRATION_BRIEF.md` — 3× `nano-banana` in parallel ($0.06/user onboarding) |
| Push notification for "video ready" | Email-only for v1; confirm |
| ~~nanobananaapi.ai vs APIYI~~ | **Resolved:** use **APIyi** — see `docs/INTEGRATIONS.md` |

### Out of Scope

- Native iOS/Android apps
- Password authentication
- Superwall
- "Try a sample drawing" feature
- Navigation menu
- Outgoing links (except ToS, Privacy)

---

## 5. PostHog Events (Analytics)

| Event | Trigger |
|-------|---------|
| `landing_page_view` | Arrives at tinyscribble.com |
| `upload_started` | Taps Upload Your Drawing |
| `image_generated` | All 3 APIYI image jobs complete (`generation_time_seconds`) |
| `image_1_accepted` / `image_2_accepted` / `image_3_accepted` | User locks variant for video |
| `result_viewed` | Sees generated image + slider |
| `cta_tapped` | Taps Bring It to Life 🎬 |
| `paywall_shown` | Stripe paywall renders |
| `trial_started` | Stripe subscription: trialing |
| `video_generated` | APIyi video job returns (`generation_time_seconds`) |
| `video_downloaded` | User downloads video |
| `second_drawing_started` | User uploads second drawing |
| `skip_trial_modal_shown` | Skip Trial modal fires |
| `skip_trial_converted` | User taps Charge and continue |
| `skip_trial_dismissed` | User taps No thanks |
| `sticky_banner_shown` | Sticky banner appears |
| `trial_reminder_sent` | 48h reminder email sent |
| `trial_converted_day3` | Day 3 auto-charge |
| `trial_cancelled` | User cancels before day 3 |

---

## 6. Critical Backend Flows

### Stripe Webhooks

- `checkout.session.completed` — Create Supabase account, transfer session image, start video generation

### Cron / Scheduled Jobs

- T+48h from `subscription.created` — Send trial reminder email

### Stripe Customer Portal

- Cancellation link in trial reminder email

---

## 7. Cost Model (Per Session)

| Item | Cost |
|------|------|
| Image generation (3× parallel, onboarding) | ~$0.06 per user (3 × $0.02) per APIYI brief |
| Video generation | Per APIyi billing |

---

*End of Technical Scope — v1.5*
