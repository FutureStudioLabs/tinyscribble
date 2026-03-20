# TinyScribble — APIYI Integration Brief

**Developer Reference · Version 1.0 · March 2026 · Future Studio LLC · Confidential**

---

## 1. What is APIYI — Plain English

### How it fits into TinyScribble

APIYI is a middleman service that gives access to AI models made by Google and OpenAI, but at a lower price than going directly to them. Instead of signing up separately with Google and OpenAI, TinyScribble only needs one APIYI account and one API key to access everything.

Think of it like a phone contract reseller. The phone calls still go through the same network — Google and OpenAI's actual AI models — but the billing and access is managed by APIYI at a cheaper rate.

**TinyScribble uses APIYI for exactly two things:**

1. Turning a child's drawing into a CGI image (**Nano Banana** model, image generation)
2. Turning that CGI image into an animated video (**VEO 3.1 Fast FL** model, video generation)

These are two completely separate API calls that happen at different moments in the user journey. They do not overlap or interfere with each other.

| Item | Value |
|------|--------|
| **Base URL** | `https://api.apiyi.com` |
| **Backup URL** | `https://vip.apiyi.com` (use if primary fails) |
| **API standard** | OpenAI-compatible — same code format as OpenAI's API |
| **Authentication** | `Authorization: Bearer sk-YOUR_APIYI_KEY` (every request header) |
| **API key location** | Login at api.apiyi.com → Token Management → copy key |
| **Billing type** | Pay-per-use — deducted from prepaid credit balance. No monthly fee. |
| **Charging rule** | Only charged for successful generations. Failed calls are free. |

> ⚠️ **APIYI is a third-party relay based in China.** It routes calls through official Google and OpenAI infrastructure. Use it for development and early production, but plan to migrate to direct providers (fal.ai, Google Vertex, or OpenAI API directly) once TinyScribble reaches significant scale.

> ⚠️ **Store the APIYI API key in server-side environment variables ONLY.** Never expose it in client-side/browser code. Anyone who gets this key can spend your money.

**Public docs:** [https://docs.apiyi.com/en](https://docs.apiyi.com/en)

---

## 2. Image Generation — Drawing → CGI Image

**Model:** `nano-banana` · **$0.02 per image** · **45–60 seconds**

### 2.1 What this step does

When a user uploads a photo of their child's drawing, TinyScribble sends that drawing to the nano-banana model along with a text instruction. The model returns a photorealistic CGI version of the drawing — styled like a Pixar movie frame.

**This happens BEFORE the paywall.** The image is generated for free (the $0.02 cost is absorbed). The user sees the result. Only then are they asked to pay for the video.

### 2.2 The API call — step by step

This uses APIYI's **chat completions** endpoint. Even though it says "chat", this endpoint handles image generation too when you pass an image as part of the message.

| Item | Detail |
|------|--------|
| **Endpoint** | `POST https://api.apiyi.com/v1/chat/completions` |
| **Model name** | `nano-banana` (exact string — confirmed from APIYI pricing page) |
| **Cost** | $0.020 per image |
| **Generation time** | 45–60 seconds |
| **Request format** | JSON (`Content-Type: application/json`) |
| **What you send** | The text prompt + the **URL** of the user's uploaded drawing |
| **What you receive** | A base64-encoded image (decode and save to R2) |

> 📝 The user's drawing must first be uploaded to **Cloudflare R2** to get a **public URL**. That URL goes into the `image_url` field below.

**Request body structure:**

```json
{
  "model": "nano-banana",
  "stream": false,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "[USE THE EXACT IMAGE PROMPT FROM SECTION 2.4]"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://your-r2-bucket.com/drawings/user-drawing.jpg"
          }
        }
      ]
    }
  ]
}
```

### 2.3 Handling the response

The model returns the generated image as a **base64 string** — not a URL. Decode it and save as an image file.

**Where to find the image data:** `response.choices[0].message.content`

**Extract (JavaScript/Node.js):**

```javascript
const content = response.choices[0].message.content;

// Try standard format first: data:image/png;base64,<data>
let match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);

// Fall back to raw base64 (long string of 100+ chars)
if (!match) match = content.match(/([A-Za-z0-9+/=]{100,})/);

const imageBuffer = Buffer.from(match[1], "base64");
// Now upload imageBuffer to Cloudflare R2
```

After decoding: upload the image bytes to R2. Save the resulting R2 URL in Supabase linked to the user's session. This R2 URL is what gets shown on the reveal screen, and later sent to the video API.

### 2.4 Exact image generation prompt

Use this **exact** text as the `text` field. Do not modify without testing:

```
Transform this child's drawing into a single unified cinematic CGI scene, like a frame from a Pixar or DreamWorks animated film. SUBJECTS — identify all primary subjects. Render each with full 3D volume, depth, physical mass, real shadows. Choose materials appropriate to what each subject actually is. STRICT FIDELITY — render ONLY what is drawn. Do not add, invent, or complete any features not visible. The child must instantly recognise every subject. Preserve all shapes, proportions and imperfections exactly. ENVIRONMENT — infer correct environment from drawing content. DRAWN ENVIRONMENT ELEMENTS — sky marks, suns, ground lines become fully integrated 3D elements. COLOR — preserve drawing's exact colors. TEXT AND LABELS — ignore all written text. Do not render in output. FOREIGN OBJECTS — ignore anything not part of drawing: hands, pens, cups, surfaces. LIGHTING — natural lighting appropriate to environment. All elements share identical lighting and cast consistent shadows. CAMERA — choose angle that best presents subjects as they appear in drawing. 9:16 vertical. OUTPUT — one seamless CGI film frame. No paper, no drawing surface, no hand, no pencil marks.
```

### 2.5 Three-image upfront generation — onboarding flow

When a user uploads their drawing for the first time, TinyScribble generates **all 3 images at the same moment — in parallel.**

- The user waits **once** (45–60 seconds total), not three times.
- Image 1 is shown on the reveal screen when all three are ready.
- If the user taps "Try another", images 2 and 3 are already in R2 — instant, zero additional wait.

> ⚠️ All 3 API calls must be fired simultaneously using **`Promise.all()`** — NOT sequentially. Sequential would cost 3× the wait time (2–3 minutes). Parallel takes the same 45–60 seconds as a single call.

**Implementation sketch:**

```javascript
const [image1, image2, image3] = await Promise.all([
  generateImage(drawingUrl, imagePrompt),
  generateImage(drawingUrl, imagePrompt),
  generateImage(drawingUrl, imagePrompt),
]);

const r2Urls = await Promise.all([
  uploadToR2(image1),
  uploadToR2(image2),
  uploadToR2(image3),
]);

await supabase.from("sessions").update({
  image_url_1: r2Urls[0],
  image_url_2: r2Urls[1],
  image_url_3: r2Urls[2],
  images_generated_at: new Date().toISOString(),
}).eq("id", sessionId);
```

The same drawing URL and the same prompt are sent for all 3 calls. The model introduces natural variation between runs.

| Item | Detail |
|------|--------|
| **Cost per onboarding user** | $0.06 (3 × $0.02) — charged regardless of how many images the user views |
| **Supabase schema** | `image_url_1`, `image_url_2`, `image_url_3` on sessions |
| **Which image goes to video?** | Track `image_accepted`: 1, 2, or 3 |
| **PostHog** | `image_1_accepted`, `image_2_accepted`, `image_3_accepted` |

### 2.6 Error handling — image

| Situation | Action |
|-----------|--------|
| No image in response | Retry once; then error + "Try again". PostHog: `image_generation_failed` |
| Request > 90s | Timeout — retry UI. PostHog: `image_generation_timeout` |
| HTTP 401 | Invalid API key — check `APIYI_API_KEY` |
| HTTP 429 | Wait 10s, exponential backoff |

---

## 3. Video Generation — CGI Image → Animated Video

**Model:** `veo-3.1-fast-fl` · **$0.15 per video** · **30–60 seconds** · **Async 3-step process**

### 3.1 What this step does

After the user pays, TinyScribble takes the accepted CGI image and sends it to **veo-3.1-fast-fl**. The `-fl` means **first/last frame** — the image is locked as the exact first frame of the video.

| Item | Detail |
|------|--------|
| **Model name** | `veo-3.1-fast-fl` (exact string) |
| **Cost** | $0.150 per video (success only) |
| **Output** | 8-second MP4, 720×1280 portrait (9:16), auto audio |
| **Request** | **`multipart/form-data`** — NOT JSON |
| **Video URL validity** | **24 hours** — download and store to R2 immediately |

> ⚠️ The `-fl` model **MUST** receive **`multipart/form-data`**. The image is sent as file binary. JSON will fail.

### 3.2 The 3-step process

**STEP 1 — Submit task**

```http
POST https://api.apiyi.com/v1/videos
Content-Type: multipart/form-data
Authorization: Bearer sk-YOUR_APIYI_KEY
```

**Form fields:**

- `prompt` — exact text from §3.4
- `model` — `veo-3.1-fast-fl`
- `input_reference` — CGI image file binary (from R2)

**Response:**

```json
{
  "id": "video_abc123",
  "status": "queued",
  "model": "veo-3.1-fast-fl"
}
```

Save `id` for Steps 2–3.

**STEP 2 — Poll**

```http
GET https://api.apiyi.com/v1/videos/video_abc123
Authorization: Bearer sk-YOUR_APIYI_KEY
```

| Status | Meaning |
|--------|---------|
| `queued` | Wait 5–10s, poll again |
| `processing` | Wait 5–10s, poll again |
| `completed` | Go to Step 3 |
| `failed` | Do not charge user. PostHog `video_generation_failed`. Retry once. |

**Max wait:** 10 minutes — then treat as failed.

**STEP 3 — Get video**

```http
GET https://api.apiyi.com/v1/videos/video_abc123/content
Authorization: Bearer sk-YOUR_APIYI_KEY
```

**Response:**

```json
{
  "status": "completed",
  "url": "https://...",
  "duration": 8,
  "resolution": "720x1280"
}
```

Download MP4 immediately → upload to R2 → save R2 URL in Supabase. Never show users the APIYI URL.

### 3.3 Background processing — UX

1. User pays → Stripe webhook → trigger video Step 1 immediately.
2. Show video loading screen.
3. If user navigates away: polling continues on server.
4. On complete: R2 upload → Supabase → Resend "video ready" email.
5. Gallery shows video from R2.

### 3.4 Exact video animation prompt

Use this **exact** text as the `prompt` form field:

```
Bring this image to life as a scene from a Pixar or DreamWorks animated film. Every subject should perform the action most natural and characteristic for what it is — moving with purpose, personality and fluid life. The environment responds to its natural forces. Movement should be warm, expressive and fully committed, not subtle or minimal. Nothing added, nothing removed, nothing recomposed. Single continuous shot — no cuts, no transitions, no new scenes. Composition and framing should start as shown and animate from there.
```

### 3.5 Error handling — video

| Situation | Action |
|-----------|--------|
| `failed` | No charge. PostHog + Sentry. Retry once. |
| No completion after 10 min | Failed — same handling |
| HTTP 401 | Check env |
| HTTP 429 | Wait 30s, exponential backoff |
| Expired video URL | Prevent by immediate R2 download; else re-run generation |

---

## 4. Complete File Journey

1. **User uploads drawing** → R2 (public URL) → Supabase session.
2. **Image generation** → APIYI `nano-banana` with R2 URL → base64 → decode → R2 (CGI) → Supabase.
3. **User pays** → Stripe; webhook: Supabase user + **`metadata.supabase_user_id`** on Stripe customer.
4. **Video** → Download CGI from R2 → multipart to `veo-3.1-fast-fl` → poll → download MP4 → R2 → Supabase.
5. **Playback** → Always from **R2**, never APIYI URLs in the client long-term.

---

## 5. Environment Variables

| Variable | Purpose |
|----------|---------|
| `APIYI_API_KEY` | `sk-xxxx` from APIYI dashboard. **SERVER-SIDE ONLY.** No `NEXT_PUBLIC_` prefix. |
| `APIYI_BASE_URL` | `https://api.apiyi.com` |
| `APIYI_IMAGE_MODEL` | `nano-banana` |
| `APIYI_VIDEO_MODEL` | `veo-3.1-fast-fl` |

> ⚠️ None of the APIYI variables should use `NEXT_PUBLIC_` in Next.js.

---

## 6. Confirmed Model Reference

| Use | Model | Cost | Do NOT use |
|-----|-------|------|------------|
| **Image** | `nano-banana` | $0.020 | `nano-banana-2` ($0.045), `nano-banana-pro` ($0.050) |
| **Video** | `veo-3.1-fast-fl` | $0.150 | `veo-3.1` (no frame lock), `veo-3.1-fast` (drift), landscape variants |

> ⚠️ **Always use `veo-3.1-fast-fl`** for frame lock.

---

## 7. Error Monitoring — Sentry

### 7.1 Why Sentry is required

PostHog = behaviour. Sentry = what breaks. Both required.

Image/video flows are async third-party calls — silent failures need Sentry.

### 7.2 Installation

```bash
npx @sentry/wizard@latest -i nextjs
```

**Env:**

- `SENTRY_DSN`
- `SENTRY_ORG`, `SENTRY_PROJECT`
- `NEXT_PUBLIC_SENTRY_DSN` — **intentionally public** for Sentry client (exception to the APIYI rule)

### 7.3 Manual captures (include `sessionId` in `extra`)

- `image_generation_failed` — `Sentry.captureException`
- `video_generation_failed`
- `Image generation timeout` — `captureMessage`, level warning
- `Video generation timeout`
- `stripe_webhook_failed`
- `r2_upload_failed`

### 7.4 PostHog vs Sentry

| Tool | Answers |
|------|---------|
| **PostHog** | Where do users drop off? (`image_accepted`, `paywall_hit`, …) |
| **Sentry** | What code/API failed? For how many users? |

---

## 8. Testing Checklist

### Image

- [ ] 3 parallel API calls; ~45–90s total (not 3×)
- [ ] `image_url_1/2/3` in Supabase; `image_accepted` on pick
- [ ] Diverse drawing tests; errors + retry; all served from R2

### Video

- [ ] `multipart/form-data` only; correct `image_accepted` image
- [ ] `video_id` saved after Step 1; polling stops on complete/fail
- [ ] MP4 → R2 immediately; failure handling; background + email; R2-only playback

### PostHog

- [ ] `image_1/2/3_accepted`, `video_generated`, failure events, `paywall_hit`

### Sentry

- [ ] Deliberate error appears in dashboard < 2 min
- [ ] `sessionId` on captures; DSN correct

### Security

- [ ] `metadata.supabase_user_id` on Stripe customer
- [ ] No APIYI key in browser
- [ ] `NEXT_PUBLIC_` only for Sentry DSN among secrets policy

---

*End of APIYI Integration Brief — v1.0 · Future Studio LLC · tinyscribble.com*
