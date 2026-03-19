import Link from "next/link";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link href="/" className={className}>
      <span
        className="text-2xl font-bold lowercase tracking-tight inline-flex items-baseline gap-0.5"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        <span
          style={{
            background: "linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          tiny
        </span>
        <span className="rounded-lg px-1.5 py-0.5 bg-[#FF9E6C]/30">
          <span
            style={{
              background: "linear-gradient(135deg, #FF7B5C 0%, #FF9E6C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            scribble
          </span>
        </span>
      </span>
    </Link>
  );
}
