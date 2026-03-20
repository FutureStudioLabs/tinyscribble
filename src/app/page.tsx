import Link from "next/link";
import Image from "next/image";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { HeaderUserAvatar } from "@/components/auth/HeaderUserAvatar";
import { funnelPrimaryButtonClassName } from "@/components/ui/FunnelPrimaryButton";
import { Footer } from "@/components/Footer";
import { JustPictureIt } from "@/components/JustPictureIt";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F5]">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-4 bg-[#FFF8F5]/80 backdrop-blur-md border-b border-white/20">
        <Logo />
        <HeaderUserAvatar showLoginWhenAnonymous />
      </header>

      {/* Hero — min 100vh; CTA follows headline (not pinned to viewport bottom) */}
      <main className="min-h-[100vh] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          {/* Hero video — autoplay looping, silent */}
          <div className="mb-4 flex aspect-[3/4] max-h-[50vh] w-full max-w-md flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black">
            <video
              src="/main.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>

          {/* Headline */}
          <h1
            className="mb-2 max-w-md text-center text-[32px] font-bold text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-fredoka)", lineHeight: 1.2 }}
          >
            Bring Your Child&apos;s
            <br />
            Drawing to Life
          </h1>

          {/* Subheadline with Free badge */}
          <p
            className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center text-base text-[#6B6B6B] sm:text-lg"
            style={{ fontFamily: "var(--font-body)", lineHeight: 1.5 }}
          >
            Your first video is{" "}
            <span className="inline-flex items-center rounded-full bg-[#4ECDC4] px-3 py-0.5 text-sm font-semibold text-white">
              Free
            </span>
          </p>

          {/* Primary CTA + legal — inline with hero content */}
          <div className="w-full space-y-4">
            <Link
              href="/upload"
              className={funnelPrimaryButtonClassName}
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing
              <span className="text-lg">↑</span>
            </Link>
            <p
              className="mx-auto max-w-sm text-center text-[13px] text-[#9B9B9B]"
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
        </div>
      </main>

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
              href="/upload"
              className="flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing
              <span className="text-lg">↑</span>
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
              className="flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full border-2 border-[#FF7B5C] px-6 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing
              <span className="text-lg">↑</span>
            </Link>
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
              href="/upload"
              className="flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full border-2 border-[#FF7B5C] px-5 text-[#FF7B5C] font-semibold text-sm transition-colors hover:bg-[#FF7B5C]/5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Upload Your Drawing
              <span className="text-lg">↑</span>
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
              className={`${funnelPrimaryButtonClassName} shadow-lg`}
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

      <Footer />
    </div>
  );
}
