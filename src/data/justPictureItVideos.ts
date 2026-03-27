export const JUST_PICTURE_IT_TABS = ["People", "Products", "Animals"] as const;
export type JustPictureItTab = (typeof JUST_PICTURE_IT_TABS)[number];

/** Served from `public/just-picture-it/{1..19}.mp4` */
export const JUST_PICTURE_IT_VIDEO_PATHS: readonly string[] = Array.from(
  { length: 19 },
  (_, i) => `/just-picture-it/${i + 1}.mp4`
);

/**
 * Even split across tabs (order matches filenames 1–19).
 * Adjust mapping if you label clips by category later.
 */
export const JUST_PICTURE_IT_INDICES_BY_TAB: Record<
  JustPictureItTab,
  readonly number[]
> = {
  People: [0, 1, 2, 3, 4, 5, 6],
  Products: [7, 8, 9, 10, 11, 12],
  Animals: [13, 14, 15, 16, 17, 18],
};
