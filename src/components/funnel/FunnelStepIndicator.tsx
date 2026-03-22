/** Shared “Step N of 4” chrome for the creation funnel (upload → save → CGI → video). */

export const FUNNEL_STEP_TOTAL = 4;

export type FunnelStepNumber = 1 | 2 | 3 | 4;

type Props = {
  step: FunnelStepNumber;
  className?: string;
};

export function FunnelStepIndicator({ step, className = "" }: Props) {
  const pct = (step / FUNNEL_STEP_TOTAL) * 100;

  return (
    <div className={className}>
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B9B9B]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Step {step} of {FUNNEL_STEP_TOTAL}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF7B5C] to-[#FF9B7B] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
