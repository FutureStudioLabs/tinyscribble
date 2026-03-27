/**
 * Before/after image pairs for the landing page (“See What’s Possible” slider +
 * side-by-side block under “Your child’s drawing, brought to life”).
 * Files live under `public/before-after/` (`*_1` = drawing, `*_2` = generated scene).
 */
export type BeforeAfterPair = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

export const BEFORE_AFTER_PAIRS: BeforeAfterPair[] = [
  {
    beforeSrc: "/before-after/UFO_1.png",
    afterSrc: "/before-after/UFO_2.png",
    beforeAlt: "Child’s UFO drawing",
    afterAlt: "AI-generated UFO scene",
  },
  {
    beforeSrc: "/before-after/Wizard_1.png",
    afterSrc: "/before-after/wizard_2.png",
    beforeAlt: "Child’s wizard drawing",
    afterAlt: "AI-generated wizard scene",
  },
  {
    beforeSrc: "/before-after/ballerina_1.png",
    afterSrc: "/before-after/ballerina_2.png",
    beforeAlt: "Child’s ballerina drawing",
    afterAlt: "AI-generated ballerina scene",
  },
  {
    beforeSrc: "/before-after/cow_1.png",
    afterSrc: "/before-after/cow_2.png",
    beforeAlt: "Child’s cow drawing",
    afterAlt: "AI-generated cow scene",
  },
  {
    beforeSrc: "/before-after/firebird_two_1.png",
    afterSrc: "/before-after/firebird_two_2.png",
    beforeAlt: "Child’s firebird drawing",
    afterAlt: "AI-generated firebird scene",
  },
  {
    beforeSrc: "/before-after/hotairballon_1.png",
    afterSrc: "/before-after/hotairballon_2.png",
    beforeAlt: "Child’s hot air balloon drawing",
    afterAlt: "AI-generated hot air balloon scene",
  },
  {
    beforeSrc: "/before-after/manonboat_1.png",
    afterSrc: "/before-after/manonboat_2.png",
    beforeAlt: "Child’s boat drawing",
    afterAlt: "AI-generated boat scene",
  },
  {
    beforeSrc: "/before-after/octopus_1.png",
    afterSrc: "/before-after/octopus_2.png",
    beforeAlt: "Child’s octopus drawing",
    afterAlt: "AI-generated octopus scene",
  },
  {
    beforeSrc: "/before-after/princess_1.png",
    afterSrc: "/before-after/princess_2.png",
    beforeAlt: "Child’s princess drawing",
    afterAlt: "AI-generated princess scene",
  },
  {
    beforeSrc: "/before-after/uboat_1.png",
    afterSrc: "/before-after/uboat_2.png",
    beforeAlt: "Child’s submarine drawing",
    afterAlt: "AI-generated submarine scene",
  },
];

export function pickRandomBeforeAfterPair(): BeforeAfterPair {
  const i = Math.floor(Math.random() * BEFORE_AFTER_PAIRS.length);
  return BEFORE_AFTER_PAIRS[i]!;
}

/** Prefer a different pair than `exclude` so two on-page sliders rarely match. */
export function pickRandomBeforeAfterPairExcluding(
  exclude: BeforeAfterPair
): BeforeAfterPair {
  const others = BEFORE_AFTER_PAIRS.filter(
    (p) =>
      p.beforeSrc !== exclude.beforeSrc || p.afterSrc !== exclude.afterSrc
  );
  const pool = others.length > 0 ? others : BEFORE_AFTER_PAIRS;
  const i = Math.floor(Math.random() * pool.length);
  return pool[i]!;
}
