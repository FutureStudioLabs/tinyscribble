import Image from "next/image";

const EXAMPLES: { src: string; alt: string; filename: string }[] = [
  {
    src: "/upload-examples/Stickman_drawing.jpeg",
    alt: "Example: stick figure drawing",
    filename: "stickman-drawing.jpeg",
  },
  {
    src: "/upload-examples/Superman_drawing.jpg",
    alt: "Example: superhero drawing",
    filename: "superman-drawing.jpg",
  },
  {
    src: "/upload-examples/Unicorn_drawing.jpg",
    alt: "Example: unicorn drawing",
    filename: "unicorn-drawing.jpg",
  },
];

export type ExamplePickInfo = { src: string; filename: string };

type Props = {
  className?: string;
  /** When set, tapping an example starts the funnel with that file (no system picker). */
  onExamplePick?: (info: ExamplePickInfo) => void | Promise<void>;
  examplesDisabled?: boolean;
};

/**
 * Step 1 helper: “No image?” row + three example tiles (below primary CTA on /upload).
 * Assets live in `public/upload-examples/` (copied from Desktop).
 */
export function FunnelUploadGreatExamples({
  className = "",
  onExamplePick,
  examplesDisabled = false,
}: Props) {
  const interactive = Boolean(onExamplePick);

  return (
    <div className={`mx-auto mt-6 w-full sm:mt-8 ${className}`}>
      <p
        className="mb-3 text-center text-[14px] font-bold leading-snug text-[#334155] sm:mb-4 sm:text-[15px]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        No image? Try one of these:
      </p>
      <div className="mx-auto max-w-[13.5rem] sm:max-w-[15rem]">
        <ul
          className="grid grid-cols-3 gap-2 sm:gap-3"
          aria-label="Example drawing styles to try"
        >
          {EXAMPLES.map((item) => (
            <li key={item.src}>
              {interactive ? (
                <button
                  type="button"
                  disabled={examplesDisabled}
                  onClick={() => void onExamplePick?.({ src: item.src, filename: item.filename })}
                  className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border-0 p-0 shadow-sm ring-1 ring-black/[0.04] transition hover:ring-2 hover:ring-[#FF7B5C]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B5C] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Use example: ${item.alt}`}
                >
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 28vw, 120px"
                    aria-hidden
                  />
                </button>
              ) : (
                <div className="relative aspect-square overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.04]">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 28vw, 120px"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
