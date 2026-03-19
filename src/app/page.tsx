import Link from "next/link";
import Image from "next/image";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { JustPictureIt } from "@/components/JustPictureIt";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5]">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-4 bg-[#FFF8F5]/80 backdrop-blur-md border-b border-white/20">
        <Logo />
        <Link
          href="/login"
          className="flex h-12 min-h-[48px] items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Login
        </Link>
      </header>

      {/* Hero — fits in 100vh, above the fold */}
      <div className="h-screen min-h-[100dvh] flex flex-col">
        {/* Hero content — flex-1 to fill remaining space */}
        <main className="flex-1 flex flex-col items-center justify-center px-5 pb-6 min-h-0 overflow-y-auto">
          {/* Hero video — autoplay looping, silent */}
          <div className="w-full max-w-md mx-auto mb-4 rounded-2xl overflow-hidden aspect-[3/4] max-h-[50vh] flex items-center justify-center bg-black flex-shrink-0">
            <video
              src="/main.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Headline */}
          <h1
            className="text-center text-[32px] font-bold text-[#1A1A1A] mb-2 max-w-md"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Bring Your Child&apos;s
            <br />
            Drawing to Life
          </h1>

          {/* Subheadline with Free badge */}
          <p
            className="text-center text-[#6B6B6B] text-base sm:text-lg mb-4 flex flex-wrap items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Your first video is{" "}
            <span className="inline-flex items-center rounded-full bg-[#4ECDC4] px-3 py-0.5 text-sm font-semibold text-white">
              Free
            </span>
          </p>

          {/* Primary CTA — full-width pill */}
          <Link
            href="/upload"
            className="flex w-full max-w-md h-14 min-h-[56px] items-center justify-center gap-2 rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-colors hover:bg-[#FF6B4A] active:scale-[0.98]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Upload Your Drawing
            <span className="text-lg">↑</span>
          </Link>

          {/* Legal micro-copy */}
          <p
            className="mt-4 text-center text-[13px] text-[#9B9B9B] max-w-sm"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
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

      {/* Before/After Slider — See What's Possible */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-white">
        <div className="w-full max-w-lg mx-auto">
          <h2
            className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-6"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            See What&apos;s Possible
          </h2>

          {/* Category tabs — pill style */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {["Animals", "People", "Fantasy", "Places", "Nature"].map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    category === "Animals"
                      ? "bg-[#FF7B5C] text-white"
                      : "bg-white/80 text-[#6B6B6B] border border-[#FF7B5C]/30 hover:bg-[#FFF8F5]"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {category}
                </button>
              )
            )}
          </div>

          {/* Before/After slider with star handle */}
          <BeforeAfterSlider
            beforeSrc="/drawing-before.png"
            afterSrc="/drawing-after.png"
            beforeAlt="Child's bunny drawing"
            afterAlt="AI-generated CGI bunny in a sunny landscape"
          />

          <div className="mt-4 flex w-full justify-center">
            <Link
              href="/examples"
              className="flex h-14 w-full max-w-md items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              See more examples →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature section — remove.bg style: heading + body + side-by-side */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-[#FFF8F5]">
        <div className="w-full max-w-lg mx-auto">
          <h2
            className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-4"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Transform drawings into photorealistic CGI
          </h2>
          <p
            className="text-center text-[#6B6B6B] text-base mb-4 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            TinyScribble takes your child&apos;s drawing and transforms it into a
            photorealistic CGI image — every line, every color, every imperfection
            preserved with{" "}
            <strong className="text-[#1A1A1A]">incredible accuracy</strong>.
          </p>
          <p
            className="text-center text-[#6B6B6B] text-base mb-6 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            But it doesn&apos;t stop there. Turn it into a short cinematic video.
            Watch it come to life.{" "}
            <strong className="text-[#1A1A1A]">Share it with family</strong>.
          </p>
          {/* Side-by-side before/after */}
          <div className="rounded-2xl overflow-hidden bg-[#efe9e6] p-3 flex gap-3 mb-6">
            <div className="flex-1 rounded-xl overflow-hidden bg-white aspect-square">
              <Image
                src="/drawing-before.png"
                alt="Child's original drawing"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 rounded-xl overflow-hidden bg-white aspect-square">
              <Image
                src="/drawing-after.png"
                alt="AI-generated CGI result"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex w-full justify-center">
            <Link
              href="/upload"
              className="flex h-14 w-full max-w-md items-center justify-center rounded-full border-2 border-[#FF7B5C] px-6 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing →
            </Link>
          </div>
        </div>
      </section>

      {/* One tool, endless uses — remove.bg style */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-white">
        <div className="w-full max-w-lg mx-auto">
          <h2
            className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-4"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            One drawing, endless magic
          </h2>
          <p
            className="text-center text-[#6B6B6B] text-base mb-8 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Upload your child&apos;s drawing and watch it become a{" "}
            <strong className="text-[#1A1A1A]">photorealistic CGI image</strong>
            . Turn it into a{" "}
            <strong className="text-[#1A1A1A]">short cinematic video</strong>{" "}
            to share with family or keep as a keepsake. Whatever your child
            creates, TinyScribble brings it to life in seconds.
          </p>
          {/* Feature cards — vertical stack, icon top-left, text bottom-left */}
          <div className="flex flex-col gap-3">
            {[
              { icon: "✨", label: "Magic Brush" },
              { icon: "💝", label: "for Families" },
              { icon: "🎁", label: "for Keepsakes" },
              { icon: "📤", label: "for Sharing" },
              { icon: "🎂", label: "for Birthday Gifts" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="rounded-2xl border-2 border-white bg-[#FFF5F2] p-5 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-[#FF7B5C]/40 transition-colors"
              >
                <span className="text-3xl">{icon}</span>
                <span
                  className="font-bold text-[#1A1A1A] flex items-center gap-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {label}
                  <span className="text-[#6B6B6B]">→</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Boost section — remove.bg style: heading + paragraphs + CTAs + grid */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-[#FFF8F5]">
        <div className="w-full max-w-lg mx-auto">
          <h2
            className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-4"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Watch your child&apos;s drawing come to life — fast and effortless
          </h2>
          <p
            className="text-center text-[#6B6B6B] text-base mb-4 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Upload a drawing. We transform it into a photorealistic CGI image.
            Every line, every color, every imperfection — preserved.
          </p>
          <p
            className="text-center text-[#6B6B6B] text-base mb-4 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Turn it into a short cinematic video in under two minutes. Share with
            family, keep as a keepsake, or{" "}
            <strong className="text-[#1A1A1A]">
              gift it to grandparents
            </strong>
            . Whatever your child creates, we bring it to life.
          </p>
          <p
            className="text-center text-[#6B6B6B] text-base mb-6 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            All from your phone or computer. No design skills needed.{" "}
            <strong className="text-[#1A1A1A]">
              Just upload and watch the magic happen
            </strong>
            .
          </p>
          {/* CTA buttons — full-width, consistent */}
          <div className="flex flex-col gap-3 mb-6">
            <Link
              href="/examples"
              className="flex h-14 w-full items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              See more examples →
            </Link>
            <Link
              href="/how-it-works"
              className="flex h-14 w-full items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              See how it works →
            </Link>
          </div>
          {/* 3x3 grid in rounded container */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#efe9e6] to-[#e5dfdc] p-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                "/drawing-before.png",
                "/drawing-after.png",
                "/drawing-before.png",
                "/drawing-after.png",
                "/drawing-before.png",
                "/drawing-after.png",
                "/drawing-before.png",
                "/drawing-after.png",
                "/drawing-before.png",
              ].map((src, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden bg-white"
                >
                  <Image
                    src={src}
                    alt={
                      i % 2 === 0
                        ? "Child's drawing"
                        : "AI-generated CGI result"
                    }
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials — remove.bg style */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-[#f8f6f5]">
        <div className="w-full max-w-lg mx-auto">
          <h2
            className="text-center text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-8"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            They love us. You will too.
          </h2>
          {/* Horizontal scroll carousel */}
          <div className="overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory">
            <div className="flex gap-4 min-w-max">
              {[
                {
                  quote:
                    "She drew this little bunny six months ago and I kept it on the fridge. I uploaded it on a whim and when I saw what came back I actually cried. She's 5. She doesn't understand why mummy is emotional over a cartoon rabbit. I do.",
                  name: "Sarah M.",
                  title: "Mum of two",
                  initials: "SM",
                  age: "5 years old.",
                },
                {
                  quote:
                    "My son drew a dinosaur and labelled it 'Rex' in his best attempt at handwriting. The AI kept every wonky line, every weird proportion — and put Rex in a real forest. He watched it move and said \"Dad, he's real now.\" I've watched that video probably 50 times.",
                  name: "James T.",
                  title: "Dad of three",
                  initials: "JT",
                  age: "6 years old.",
                },
                {
                  quote:
                    "I was skeptical. Then I uploaded my daughter's drawing of our family — five stick figures with giant heads — and watched them come to life in some magical outdoor scene. My mum called me crying when I sent it to her. Worth every penny.",
                  name: "Rachel K.",
                  title: "Mum of four",
                  initials: "RK",
                  age: "4 years old.",
                },
              ].map(({ quote, name, title, initials, age }) => (
                <div
                  key={name}
                  className="w-[320px] min-h-[520px] flex-shrink-0 snap-center rounded-[32px] border border-[#e0e0e0] bg-white p-6 flex flex-col"
                >
                  {/* Child's age — top */}
                  <div className="flex-shrink-0">
                    <span
                      className="font-bold text-[#1A1A1A] text-sm"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {age}
                    </span>
                  </div>
                  {/* Quote — fills remaining height */}
                  <p
                    className="flex-1 font-bold text-[#1A1A1A] text-[18px] text-left pt-4 min-h-0"
                    style={{
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.4,
                    }}
                  >
                    &ldquo;{quote}&rdquo;
                  </p>
                  {/* Profile — bottom */}
                  <div className="flex-shrink-0 pt-4">
                    <div className="flex flex-col gap-2">
                      <div className="w-12 h-12 rounded-full bg-[#4ECDC4]/40 flex items-center justify-center flex-shrink-0">
                        <span
                          className="font-bold text-[#1A1A1A] text-sm"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {initials}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p
                          className="font-bold text-[#1A1A1A] text-base"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {name}
                        </p>
                        <p
                          className="text-[#6B6B6B] text-sm leading-tight font-normal"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex w-full justify-center">
            <Link
              href="/success-stories"
              className="flex h-14 w-full max-w-md items-center justify-center rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Read Success Stories →
            </Link>
          </div>
        </div>
      </section>

      {/* Just picture it — new section below testimonials */}
      <JustPictureIt />

      {/* Closing CTA — remove.bg style */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-[#FFF8F5]">
        <div className="w-full max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm mb-4 text-2xl">
            ✨
          </div>
          <h2
            className="text-[32px] sm:text-[28px] font-bold text-[#1A1A1A] mb-3"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            See your child&apos;s drawing come to life — try for free
          </h2>
          <p
            className="text-[#6B6B6B] text-base mb-8"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Your first video is on us.
          </p>
          <div className="relative w-full max-w-md mx-auto mb-8">
            <div className="absolute inset-0 bg-[#FF7B5C]/20 rounded-full blur-2xl -z-10" />
            <Link
              href="/upload"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#FF7B5C] text-white font-bold text-base transition-colors hover:bg-[#FF6B4A] active:scale-[0.98] shadow-lg"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing
              <span className="text-lg">↑</span>
            </Link>
          </div>
          <p
            className="text-[13px] text-[#9B9B9B] max-w-sm mx-auto"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
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
        </div>
      </section>

      {/* Blog section — below CTA */}
      <section className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5 py-12 bg-[#f8f6f5]">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-[32px] sm:text-[28px] font-bold text-[#1A1A1A]"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              Blog
            </h2>
            <Link
              href="/blog"
              className="text-[#6B6B6B] text-sm hover:text-[#FF7B5C] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              See more articles →
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { date: "Nov 25, 2025", title: "How to turn your child's drawing into a keepsake video" },
              { date: "Nov 17, 2025", title: "5 creative ways to share your child's artwork with family" },
              { date: "Oct 20, 2025", title: "Why parents love bringing drawings to life" },
            ].map(({ date, title }, i) => (
              <Link
                key={i}
                href={`/blog/${i + 1}`}
                className="block rounded-2xl border border-[#e0e0e0] bg-white p-5 transition-colors hover:border-[#FF7B5C]/40"
              >
                <p
                  className="text-[#6B6B6B] text-sm mb-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {date}
                </p>
                <p
                  className="font-bold text-[#1A1A1A] text-base"
                  style={{ fontFamily: "var(--font-body)", lineHeight: 1.3 }}
                >
                  {title}
                </p>
              </Link>
            ))}
          </div>

          {/* Get Updates — newsletter signup */}
          <div className="mt-12 pt-8 border-t border-[#e0e0e0]">
            <h3
              className="text-[24px] font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
            >
              Get Updates
            </h3>
            <p
              className="text-[#6B6B6B] text-sm mb-6"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              Sign up for our mailing list to receive news and updates about
              TinyScribble products and services. You can unsubscribe at any
              time.
            </p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-12 rounded-full border-2 border-[#e0e0e0] px-5 text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#FF7B5C] focus:outline-none transition-colors"
                style={{ fontFamily: "var(--font-body)" }}
              />
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#FF7B5C] text-white font-bold text-sm transition-colors hover:bg-[#FF6B4A]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Subscribe
              </button>
            </form>
            <p
              className="mt-4 text-center text-[12px] text-[#9B9B9B]"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
            >
              To learn more about how TinyScribble handles your personal data,
              check our{" "}
              <Link
                href="/privacy"
                className="underline hover:text-[#6B6B6B]"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[#545e66] text-white pt-12 pb-8 overflow-hidden">
        {/* Subtle curved top */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-[#545e66] rounded-b-[50%] -translate-y-1/2" />
        <div className="relative flex flex-col items-center gap-8 px-5 pt-4">
          {/* Social icons */}
          <div className="flex gap-3">
            {[
              { name: "Facebook", href: "#", icon: "f" },
              { name: "Instagram", href: "#", icon: "ig" },
              { name: "Twitter", href: "#", icon: "x" },
              { name: "TikTok", href: "#", icon: "tt" },
              { name: "YouTube", href: "#", icon: "yt" },
              { name: "LinkedIn", href: "#", icon: "in" },
            ].map(({ name, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="flex w-10 h-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                <span className="text-xs font-bold">{name[0]}</span>
              </a>
            ))}
          </div>
          {/* Navigation links */}
          <nav className="flex flex-col items-center gap-3">
            <Link href="/terms" className="text-white/90 hover:text-white text-sm transition-colors" style={{ fontFamily: "var(--font-body)" }}>
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-white/90 hover:text-white text-sm transition-colors" style={{ fontFamily: "var(--font-body)" }}>
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-white/90 hover:text-white text-sm transition-colors" style={{ fontFamily: "var(--font-body)" }}>
              Cookie Policy
            </Link>
            <Link href="/imprint" className="text-white/90 hover:text-white text-sm transition-colors" style={{ fontFamily: "var(--font-body)" }}>
              Imprint
            </Link>
          </nav>
          {/* Copyright */}
          <p className="text-white/70 text-xs text-center" style={{ fontFamily: "var(--font-body)" }}>
            © TinyScribble, Future Studio LLC
          </p>
        </div>
      </footer>
    </div>
  );
}
