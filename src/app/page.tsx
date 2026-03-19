import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5]">
      {/* Header — Logo left, Login right */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-xl font-bold lowercase tracking-tight"
            style={{
              fontFamily: "var(--font-fredoka)",
              background: "linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            tiny scribble
          </span>
        </Link>
        <Link
          href="/login"
          className="flex h-12 min-h-[48px] items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Login
        </Link>
      </header>

      {/* Hero — remove.bg layout, Coral Dream style */}
      <main className="flex flex-1 flex-col items-center px-5 pb-12">
        {/* Hero video placeholder — autoplay looping video area */}
        <div className="w-full max-w-md mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FF7B5C]/20 via-[#FF9E6C]/15 to-[#4ECDC4]/20 aspect-[4/3] flex items-center justify-center">
          {/* Placeholder: replace with actual autoplay video when asset is ready */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-40">✨</div>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-center text-[28px] sm:text-[32px] font-bold leading-tight text-[#1A1A1A] mb-3 max-w-md"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Bring Your Child&apos;s Drawing to Life
        </h1>

        {/* Subheadline with Free badge */}
        <p
          className="text-center text-[#6B6B6B] text-base sm:text-lg mb-6 flex flex-wrap items-center justify-center gap-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Your first video is{" "}
          <span className="inline-flex items-center rounded-full bg-[#4ECDC4] px-3 py-0.5 text-sm font-semibold text-white">
            Free
          </span>
        </p>

        {/* Primary CTA — full-width pill */}
        <button
          type="button"
          className="w-full max-w-md h-14 min-h-[56px] flex items-center justify-center gap-2 rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-colors hover:bg-[#FF6B4A] active:scale-[0.98]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Upload Your Drawing
          <span className="text-lg">↑</span>
        </button>

        {/* Legal micro-copy */}
        <p
          className="mt-6 text-center text-[13px] text-[#9B9B9B] max-w-sm leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          By uploading a drawing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[#6B6B6B]">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-[#6B6B6B]">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
