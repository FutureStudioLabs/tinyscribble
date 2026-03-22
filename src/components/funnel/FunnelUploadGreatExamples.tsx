/**
 * Step 1 helper: heading + three example tiles (matches upload guidance mock).
 */
export function FunnelUploadGreatExamples({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto w-full ${className}`}>
      <div className="mx-auto max-w-[10.25rem]">
        <p
          className="mb-1.5 text-center text-[12px] font-bold leading-tight text-[#C8C8C8] sm:mb-2 sm:text-[13px] sm:text-[#BABABA]"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Here&apos;s what a great upload looks like
        </p>
        <ul className="grid grid-cols-3 gap-1 sm:gap-1.5" aria-label="Example upload styles">
          {[
            {
              emoji: "🐢",
              label: "Example: clear simple subject",
              tileClass: "bg-[#D8F0E0]",
            },
            {
              emoji: "🚴",
              label: "Example: photo with good detail",
              tileClass: "bg-[#FFE4D6]",
            },
            {
              emoji: "🐉",
              label: "Example: bold drawing",
              tileClass: "bg-[#D6EEF2]",
            },
          ].map((item) => (
            <li key={item.label}>
              <div
                className={`flex aspect-square items-center justify-center rounded-lg text-[1.45rem] leading-none sm:rounded-xl sm:text-[1.65rem] ${item.tileClass}`}
                role="img"
                aria-label={item.label}
              >
                <span aria-hidden>{item.emoji}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p
        className="mx-auto mt-2.5 max-w-[17.5rem] text-center text-[11px] leading-snug text-[#9B9B9B] sm:mt-3 sm:max-w-xs sm:text-[12px]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Clear photo · good light · drawing fills the frame
      </p>
    </div>
  );
}
