import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style guide — TinyScribble",
  description: "TinyScribble design system: colors, typography, and UI patterns.",
};

const colors = [
  { name: "Primary coral", token: "--color-primary", hex: "#FF7B5C", usage: "CTAs, links, emphasis" },
  { name: "Secondary peach", token: "--color-secondary", hex: "#FF9E6C", usage: "Gradients, highlights" },
  { name: "Accent teal", token: "--color-accent", hex: "#4ECDC4", usage: "Badges, success, gradient accents" },
  { name: "Background", token: "--color-bg", hex: "#FFF8F5", usage: "Page background" },
  { name: "Text", token: "--color-text", hex: "#1A1A1A", usage: "Headings, body" },
  { name: "Text secondary", token: "--color-text-secondary", hex: "#6B6B6B", usage: "Supporting copy" },
  { name: "Text muted", token: "--color-text-muted", hex: "#9B9B9B", usage: "Legal, captions" },
] as const;

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#1A1A1A]">
      <header className="sticky top-0 z-10 border-b border-[#FF7B5C]/10 bg-[#FFF8F5]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Logo />
          <Link
            href="/"
            className="text-sm font-semibold text-[#FF7B5C] hover:text-[#FF6B4A]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            ← Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Internal reference
        </p>
        <h1
          className="mb-3 text-4xl font-bold sm:text-5xl"
          style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.15 }}
        >
          Style guide &amp; branding
        </h1>
        <p
          className="mb-12 max-w-2xl text-lg text-[#6B6B6B]"
          style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
        >
          TinyScribble turns children&apos;s drawings into photorealistic CGI. The visual language is warm,
          playful, and trustworthy — <strong className="text-[#1A1A1A]">Coral Dream</strong> palette with soft
          peach backgrounds and a friendly wordmark.
        </p>

        {/* Brand */}
        <section className="mb-16">
          <h2
            className="mb-6 border-b border-[#FF7B5C]/20 pb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Brand
          </h2>
          <div className="rounded-2xl border border-white/60 bg-white/50 p-8 shadow-sm">
            <p className="mb-4 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
              Wordmark (default)
            </p>
            <div className="mb-6 scale-125 origin-left">
              <Logo />
            </div>
            <dl className="grid gap-3 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-[#1A1A1A]">Product name</dt>
                <dd className="text-[#6B6B6B]">TinyScribble — lowercase &quot;tiny&quot; + &quot;scribble&quot;</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-[#1A1A1A]">Tagline</dt>
                <dd className="text-[#6B6B6B]">Bring your child&apos;s drawing to life</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-[#1A1A1A]">Voice</dt>
                <dd className="text-[#6B6B6B]">Warm, encouraging, family-safe; avoid jargon</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Colors */}
        <section className="mb-16">
          <h2
            className="mb-6 border-b border-[#FF7B5C]/20 pb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Color — Coral Dream
          </h2>
          <p className="mb-6 text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            Defined in <code className="rounded bg-white/80 px-1.5 py-0.5 text-sm">globals.css</code> as CSS
            variables.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {colors.map((c) => (
              <li
                key={c.token}
                className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-sm"
              >
                <div className="h-20 w-full" style={{ backgroundColor: c.hex }} />
                <div className="p-4">
                  <p className="font-semibold" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {c.name}
                  </p>
                  <p className="font-mono text-xs text-[#6B6B6B]">{c.hex}</p>
                  <p className="mt-1 font-mono text-xs text-[#9B9B9B]">{c.token}</p>
                  <p className="mt-2 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                    {c.usage}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl border border-white/60 bg-white/50 p-6">
            <p className="mb-3 text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>
              Header gradient
            </p>
            <div
              className="h-16 w-full max-w-md rounded-xl"
              style={{ background: "linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%)" }}
            />
            <p className="mt-2 font-mono text-xs text-[#9B9B9B]">--gradient-header</p>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2
            className="mb-6 border-b border-[#FF7B5C]/20 pb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Typography
          </h2>
          <div className="space-y-8 rounded-2xl border border-white/60 bg-white/50 p-8 shadow-sm">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">
                Display — Fredoka
              </p>
              <p className="text-xs text-[#6B6B6B] mb-4">Google Fonts · weights 400–700 · headings &amp; logo</p>
              <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
                The quick brown fox
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-fredoka)" }}>
                Upload a drawing to bring it to life
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">
                Body — Plus Jakarta Sans
              </p>
              <p className="text-xs text-[#6B6B6B] mb-4">Google Fonts · weights 400–700 · UI &amp; paragraphs</p>
              <p className="text-lg" style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
                TinyScribble takes your child&apos;s drawing and transforms it into a photorealistic image. We
                use clear, readable body copy with comfortable line height (1.5).
              </p>
            </div>
            <dl className="grid gap-2 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
              <div className="flex gap-4">
                <dt className="font-mono text-[#1A1A1A]">--line-height-title</dt>
                <dd>1.2</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-mono text-[#1A1A1A]">--line-height-description</dt>
                <dd>1.5</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Components */}
        <section className="mb-16">
          <h2
            className="mb-6 border-b border-[#FF7B5C]/20 pb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            UI patterns
          </h2>
          <div className="space-y-6 rounded-2xl border border-white/60 bg-white/50 p-8 shadow-sm">
            <div>
              <p className="mb-3 text-sm font-semibold text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                Primary button
              </p>
              <button
                type="button"
                className="flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-colors hover:bg-[#FF6B4A] active:scale-[0.98]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Bring your image to life
              </button>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                Outline button
              </p>
              <button
                type="button"
                className="flex h-12 w-full max-w-sm items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Upload Your Drawing
              </button>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                Accent pill
              </p>
              <span className="inline-flex items-center rounded-full bg-[#4ECDC4] px-3 py-1 text-sm font-semibold text-white">
                Example badge
              </span>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                Progress bar
              </p>
              <div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9E6C]"
                />
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
                Gradient border (image frame)
              </p>
              <div className="h-24 w-24 rounded-[16px] p-[3px] shadow-md" style={{ background: "linear-gradient(90deg, #FF7B5C, #FF9E6C, #4ECDC4, #FF9E6C, #FF7B5C)", backgroundSize: "300% 100%", animation: "gradient-border 3s ease infinite" }}>
                <div className="h-full w-full rounded-[13px] bg-[#FFF8F5]" />
              </div>
            </div>
          </div>
        </section>

        {/* Motion */}
        <section className="mb-8">
          <h2
            className="mb-6 border-b border-[#FF7B5C]/20 pb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Motion
          </h2>
          <p className="mb-4 text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            Keyframes in <code className="rounded bg-white/80 px-1.5 py-0.5 text-sm">globals.css</code>
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            <li><code className="font-mono text-xs">fade-in</code> — 300ms, entrances</li>
            <li><code className="font-mono text-xs">scale-in</code> — 300ms, cards</li>
            <li><code className="font-mono text-xs">gradient-border</code> — shifting gradient on borders</li>
            <li><code className="font-mono text-xs">ai-glow</code> — optional pulsing shadow</li>
          </ul>
        </section>

        <footer className="border-t border-[#FF7B5C]/10 pt-8 text-center text-sm text-[#9B9B9B]" style={{ fontFamily: "var(--font-body)" }}>
          TinyScribble · Design tokens live in <code className="font-mono text-xs">src/app/globals.css</code>
        </footer>
      </main>
    </div>
  );
}
