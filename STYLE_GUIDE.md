# TinyScribble — Style Guide

**Coral Dream · Mobile-First**  
*"Warm, rounded, feels like a hug"*

---

## Design Philosophy

- **Mobile-first** — All layouts, tap targets, and typography are designed for mobile viewports first. Desktop is an enhancement.
- **Trust & emotion** — Highest trust and emotional resonance with millennial parents.
- **Keywords** — Warm, Playful, Rounded, Friendly.

---

## 1. Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Primary (Warm Coral)** | `#FF7B5C` | Main buttons, header gradients, primary CTAs |
| **Secondary (Peach Glow)** | `#FF9E6C` | Secondary accents, gradients, highlights |
| **Accent (Mint Pop)** | `#4ECDC4` | Secondary actions, badges, highlights |
| **Background (Warm White)** | `#FFF8F5` | Page background, card backgrounds |

### Semantic Colors

| Role | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#1A1A1A` | Headlines, primary body text |
| **Text Secondary** | `#6B6B6B` | Subheadlines, captions |
| **Text Muted** | `#9B9B9B` | Legal copy, footnotes |
| **White** | `#FFFFFF` | Button text, overlays |

### CSS Variables (Recommended)

```css
:root {
  /* Brand */
  --color-primary: #FF7B5C;
  --color-secondary: #FF9E6C;
  --color-accent: #4ECDC4;
  --color-bg: #FFF8F5;

  /* Text */
  --color-text: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #9B9B9B;

  /* Gradients */
  --gradient-header: linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%);
}
```

---

## 2. Typography

### Font Families

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| **Display / Wordmark** | Fredoka 700 | system-ui | Logo, hero headlines |
| **Headlines** | Fredoka 600–700 | system-ui | Section headings |
| **Body** | Plus Jakarta Sans 400–600 | system-ui | Body text, captions, UI labels |

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale (Mobile-First)

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| **Hero headline** | Fredoka | 28–32px | 700 | 1.2 |
| **Section heading** | Fredoka | 24–28px | 700 | 1.25 |
| **Card heading** | Fredoka | 18–20px | 600 | 1.3 |
| **Body large** | Plus Jakarta Sans | 16–18px | 400 | 1.5 |
| **Body** | Plus Jakarta Sans | 15–16px | 400 | 1.5 |
| **Caption** | Plus Jakarta Sans | 13–14px | 400 | 1.4 |
| **Legal / micro** | Plus Jakarta Sans | 12–13px | 400 | 1.4 |

---

## 3. Spacing & Layout

### Mobile Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| **xs** | 0px | Default (mobile-first) |
| **sm** | 375px | Large phones |
| **md** | 768px | Tablets |
| **lg** | 1024px | Small desktop |
| **xl** | 1280px | Desktop |

### Spacing Scale (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight inline |
| `space-2` | 8px | Icon gaps, small padding |
| `space-3` | 12px | Compact padding |
| `space-4` | 16px | Default padding |
| `space-5` | 20px | Section padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section gaps |
| `space-10` | 40px | Large section gaps |
| `space-12` | 48px | Hero spacing |
| `space-16` | 64px | Major section breaks |

### Container

- **Mobile:** Full width, 16–20px horizontal padding
- **Desktop:** Max-width ~1200px, centered

---

## 4. Components

### Buttons

All buttons are **pill-shaped** (`border-radius: 999px`).

| Type | Background | Text | Height | Usage |
|------|------------|------|--------|-------|
| **Primary** | `#FF7B5C` (Warm Coral) | White, bold | 56px min | Main CTAs (Upload, Start Trial) |
| **Secondary** | `#4ECDC4` (Mint Pop) | White, bold | 56px min | Secondary actions |
| **Ghost** | Transparent | `#FF7B5C`, border `#FF7B5C` | 48px min | Login, dismiss |
| **Outline** | White | `#FF7B5C`, border `#FF7B5C` | 40px | Badges, small actions |

**Tap target:** Minimum 44×44px (iOS), 48×48px (Android). Primary CTAs: 56px height.

### Cards

- **Border radius:** 16px (soft, rounded)
- **Background:** `#FFFFFF` on `#FFF8F5` for contrast
- **Shadow:** Subtle `0 2px 12px rgba(0,0,0,0.06)` for elevation

### Badges / Pills

| Type | Style | Example |
|------|-------|---------|
| **Outline** | White bg, coral border & text | "Save 58% 🥳" |
| **Solid** | Mint bg, white text | "Free trial" |
| **Dark** | Dark bg, white text | "3 DAYS FREE", "Best Value" |

---

## 5. Logo & Brand

- **Wordmark:** "tiny scribble" — lowercase, Fredoka 700, white on coral gradient
- **Slogan:** "Where drawings come alive ✨"
- **Voice:** "Your kid draws it. We make it fly."

---

## 6. Iconography

- Use consistent stroke weight (1.5–2px)
- Rounded line caps and joins
- Size: 24px default, 20px small, 32px large

---

## 7. Motion & Animation

- **Duration:** 200–300ms for micro-interactions
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` or `ease-out`
- **Loading:** Soft pulsing, gentle gradients — avoid harsh spinners

---

## 8. Accessibility

- **Contrast:** Ensure 4.5:1 minimum for body text, 3:1 for large text
- **Focus states:** Visible outline for keyboard navigation
- **Touch targets:** Minimum 44×44px
- **Reduced motion:** Respect `prefers-reduced-motion` for non-essential animations

---

## 9. Implementation Notes

### Tailwind Config (if using Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#FF7B5C',
        secondary: '#FF9E6C',
        accent: '#4ECDC4',
        'bg-warm': '#FFF8F5',
      },
      fontFamily: {
        display: ['Fredoka', 'system-ui'],
        body: ['Plus Jakarta Sans', 'system-ui'],
      },
      borderRadius: {
        'pill': '999px',
        'card': '16px',
      },
    },
  },
}
```

---

*TinyScribble Style Guide · Coral Dream · Mobile-First*
