# Upload Animation Design

**TinyScribble · Post-Upload Flow**  
*What happens the moment a user selects an image*

---

## Overview

Per PROJECT_SCOPE: **Immediate navigate to loading screen, API call in background (no preview step)**. This doc designs the transition and loading experience.

---

## Flow Timeline

```
[User selects file] → [0–300ms: Instant feedback] → [Navigate to /loading] → [Loading screen 45–60s]
```

---

## Phase 1: File Selected (0–300ms)

**Location:** Upload page (`/upload`)

**Trigger:** `onChange` fires on file input

### Animation A: Instant Feedback (Recommended)

1. **Button state** — Upload button briefly shows a checkmark ✓ or "Uploading..." (200ms)
2. **Optional:** Small toast/pill: "Got it! ✨" — fades in, fades out
3. **Navigate** — `router.push('/loading')` after 200–300ms (feels responsive, not jarring)

### Animation B: Drawing Preview Flash (Alternative)

1. **Preview appears** — Selected image flashes in a small rounded card (like the loading spec)
2. **Scale-in** — Card animates from 0.9 → 1 with `ease-out`, 200ms
3. **Navigate** — After 400ms, transition to loading (preview carries over)

---

## Phase 2: Route Transition (300–500ms)

**Location:** Between `/upload` and `/loading`

### Page Transition

- **Next.js:** Use `View Transitions API` or simple fade
- **Effect:** Current content fades out (opacity 1 → 0, 150ms), new content fades in (150ms)
- **No layout shift** — Both pages feel like one continuous flow

---

## Phase 3: Loading Screen (0–60s)

**Location:** `/loading` (per PROJECT_SCOPE)

### Layout

| Element | Spec |
|---------|------|
| **Background** | Soft animated gradient (pastel purples/blues) — or use Coral Dream: `#FFF8F5` → `#FFE8E0` gradient |
| **Drawing preview** | Small rounded card (120×120px), centered, blurred edges |
| **Animated icon** | Sparkle/wand (✨) pulsing above the card |
| **Headline** | "Bringing your drawing to life…" (Fredoka) |
| **Messages** | Rotating every 8–10s (6-message sequence) |
| **Progress bar** | Thin (4px), full width, slow-fill calibrated to ~55s |

### Message Sequence (6 messages)

1. "Reading every line and color…"
2. "Our AI is studying your drawing…"
3. "Almost there…"
4. "Adding a little magic ✨"
5. "Creating something special…"
6. "Just a few more seconds…"

### Progress Bar Behavior

- **Not percentage-based** — Smooth fill from 0 to 100 over ~55s
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` or linear
- **Visual:** Coral gradient (`#FF7B5C` → `#FF9E6C`)

### Drawing Preview Card

- **Size:** 120×120px (mobile), 160×160px (desktop)
- **Border radius:** 24px
- **Effect:** Soft blur (`backdrop-blur-sm`) on edges, subtle shadow
- **Animation:** Gentle pulse (scale 1 → 1.02 → 1, 2s loop) — optional

---

## Phase 4: Entrance Animation (Loading Screen)

When `/loading` mounts:

1. **Drawing card** — Fades in + scale from 0.9 → 1 (300ms)
2. **Sparkle icon** — Fades in, then starts pulsing (400ms delay)
3. **Headline** — Fades in (200ms delay)
4. **Progress bar** — Appears from 0 width, starts filling (500ms delay)
5. **First message** — Fades in (600ms delay)

---

## Error State (>90s or failure)

- **Progress bar** — Stops, turns muted red
- **Message** — "Something went wrong. Let's try again."
- **Button** — "Retry" (primary coral)
- **PostHog** — Log `image_generation_failed`

---

## Technical Notes

- **File passing:** Use React state/context or URL state to pass the selected file (or preview URL) to `/loading`
- **API call:** Start upload to R2 + image generation API in background as soon as `/loading` mounts
- **Reduced motion:** Respect `prefers-reduced-motion: reduce` — skip animations, instant transitions

---

## Summary: Recommended Flow

1. **User selects file** → 200ms: Button shows "Uploading…" or checkmark
2. **Navigate to `/loading`** → 300ms total from selection
3. **Loading screen** → Fade-in sequence, drawing preview, rotating messages, progress bar
4. **45–60s** → AI returns → Navigate to result

---

*TinyScribble Upload Animation Design · v1*
