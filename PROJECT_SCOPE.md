# TinyScribble — Technical Scope & Architecture

**Version 1.3 · March 2026**  
**Future Studio LLC · Confidential**

---

## 1. Tech Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js | SSR/ISR, mobile-first web app |
| **Hosting** | Vercel | Deployment, edge functions |
| **Database** | Supabase (PostgreSQL) | User data, sessions, metadata |
| **Auth** | Supabase Auth | Magic link only, no passwords |
| **Storage** | Cloudflare R2 | Images, videos, drawings |
| **Image Generation** | Google Nano Banana 2 (Gemini 3.1 Flash) via nanobananaapi.ai | ~$0.04/image, 45–60s |
| **Video Generation** | Veo 3.1 via kie.ai | ~$0.30 per 8s video, 60–90s |
| **Payments** | Stripe (hosted Checkout) | Subscriptions, 3-day trial, card collection |
| **Email** | Resend | Magic links, transactional emails |
| **Analytics** | PostHog | Event tracking, funnel analysis |

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
| Background | Soft animated gradient (pastel purples/blues) |
| Drawing preview | Small rounded card, centered, blurred edges |
| Animated icon | Sparkle/wand pulsing |
| Messages | Rotating every 8–10s (6-message sequence) |
| Progress bar | Thin, slow-fill calibrated to ~55s, not percentage-based |
| Error state | >90s or failure: retry button, PostHog log |

### 3.4 Result — Image Preview

| Element | Specification |
|---------|---------------|
| Reveal | Cinematic fade or zoom-in (not instant swap) |
| Before/After Slider | Same drag-handle as landing page; left = original, right = AI result |
| Handle behavior | Auto-animates right→left on load, then center for user |
| Drawing thumbnail | Always visible in corner |
| Primary CTA | "Bring It to Life 🎬" → Stripe paywall |
| Variations | "See more versions" — 2 additional variants (v2; defer if complex) |

### 3.5 Paywall — Stripe Direct

| Element | Specification |
|---------|---------------|
| Layout | Top-to-bottom per Cal AI paywall_sample.png |
| Heading | "Start your 3-day FREE trial to continue." |
| Trial timeline | Vertical timeline: TODAY (lock) → DAY 2 (bell) → DAY 3 (crown) |
| Plan cards | Monthly ($7.99/mo) | Annual ($4.17/mo, billed $49.99/yr) |
| Annual display | Large: "$4.17/mo" — Small: "Billed as $49.99/yr" |
| Badges | "3 DAYS FREE", "Best Value" on annual |
| No Payment line | "✓ No Payment Due Now" — prominent |
| CTA button | "Start Free Trial" — full-width, black (Cal AI style) |
| Stripe type | Hosted Checkout (redirect) |

**Stripe subscription config:**

```javascript
trial_period_days: 3
payment_behavior: "default_incomplete"
save_default_payment_method: "on_subscription"
```

### 3.6 Loading — Video Generation (60–90s)

| Element | Specification |
|---------|---------------|
| Visual | Selected AI image centered, soft particles/sparkles |
| Badge | "🎬 Creating your video…" — pulsing |
| Messages | Rotate every 10s (5-message sequence) |
| Progress bar | Thin, calibrated to ~75s |
| Background generation | If user leaves: continue in background, email on completion |

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
- Image generation (Nano Banana 2)
- Result screen with before/after slider
- Stripe paywall (in-house UI, hosted Checkout)
- Video generation (Veo 3.1)
- Gallery with trial banner
- Full trial lifecycle (skip, banner, reminder, expiry)
- Magic link auth
- PostHog analytics (all events)
- Resend transactional emails

### Deferred / Open (v2)

| Item | Status |
|------|--------|
| 3 parallel image variations on result screen | Defer to v2 (adds $0.08/session + complexity) |
| Push notification for "video ready" | Email-only for v1; confirm |
| nanobananaapi.ai vs APIYI | Ashik to verify API docs and reliability |

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
| `image_generated` | NB2 returns (`generation_time_seconds`) |
| `result_viewed` | Sees generated image + slider |
| `cta_tapped` | Taps Bring It to Life 🎬 |
| `paywall_shown` | Stripe paywall renders |
| `trial_started` | Stripe subscription: trialing |
| `video_generated` | Veo returns (`generation_time_seconds`) |
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
| Image generation (1x) | ~$0.04 |
| Image variations (3x, if v2) | +$0.08 |
| Video generation | ~$0.30 |

---

*End of Technical Scope — v1.3*
