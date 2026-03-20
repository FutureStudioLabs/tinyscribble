import { SUPPORT_EMAIL } from "@/constants/support";

type SupportContactProps = {
  className?: string;
  /** Included in the mailto body so support can see what the user saw */
  errorSummary?: string | null;
};

export function SupportContact({ className = "", errorSummary }: SupportContactProps) {
  const subject = encodeURIComponent("TinyScribble — need help");
  const body = errorSummary?.trim()
    ? encodeURIComponent(
        `What went wrong (from the app):\n${errorSummary.trim()}\n\nAnything else we should know:\n`
      )
    : encodeURIComponent("What were you trying to do?\n\n");
  const href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <p
      className={`text-sm text-[#6B6B6B] ${className}`.trim()}
      style={{ fontFamily: "var(--font-body)" }}
    >
      Still stuck? Email{" "}
      <a
        href={href}
        className="font-semibold text-[#FF7B5C] underline underline-offset-2 hover:text-[#FF6B4A]"
      >
        {SUPPORT_EMAIL}
      </a>
      .
    </p>
  );
}
