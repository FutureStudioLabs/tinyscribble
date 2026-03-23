# Gallery thumbnails / video previews 404 (`/api/media`)

Symptoms:

- **Older** gallery items load fine on `https://tinyscribble.vercel.app`.
- **New** uploads, CGI images, or videos show broken media; Network tab shows `GET /api/media?key=...` **404**.

## What’s going on

`/api/media` reads objects from **Cloudflare R2** using **server env** `R2_*` on **that** deployment (e.g. Vercel Production).

`gallery_items` rows live in **Supabase** (`r2_key` column). They do **not** copy the file — they only store the path.

So you need:

1. The **row** to exist in the Supabase project your app uses, and  
2. The **object** to exist in the **same** R2 bucket your **Vercel** server uses.

If **new** rows 404 on Vercel but **old** rows work, the usual explanation is:

### Different Cloudflare account / bucket (intentional)

Your **local** `.env` may point at **your** R2 bucket (your account). **Production** (e.g. Vercel) uses **another** bucket, often another Cloudflare account. Files you upload or generate **only** exist in the bucket that received the write. There is no automatic sync between accounts — align env for the environment you’re testing, or copy objects into the prod bucket when debugging.

### Local dev + production Supabase (most common)

You run the app on **localhost** with:

- `NEXT_PUBLIC_SUPABASE_URL` → **production** Supabase (or you sign in against prod), so `gallery_items` inserts go to **production** DB.
- `R2_*` → a **local/dev** R2 bucket (or different bucket than Vercel).

Files are written to **dev R2**. Rows point at keys like `uploads/1774…` / `generated/…` in **production** Supabase.

On **Vercel**, `/api/media` looks in **production** R2 → **NoSuchKey / 404** for those keys.

Older items were created when the **full** flow ran on Vercel (or when R2 matched), so they still open.

### Fix

Pick one strategy:

| Approach | Use when |
|----------|----------|
| **Separate stacks** | Local: dev Supabase + dev R2. Production: prod Supabase + prod R2. Never mix. |
| **Intentional prod testing from laptop** | Point **local** `R2_*` at the **same** bucket as Vercel (same account, keys, bucket name). **Risk:** dev bugs can delete/overwrite real user data. |

Also confirm **Vercel → Project → Settings → Environment Variables**: every `R2_*` value matches the bucket where you expect production traffic to write.

## Quick check

1. In Cloudflare R2, open the bucket Vercel uses.
2. Search or browse for a failing key from the Network tab (e.g. `uploads/1774029179511-…`).
3. If it’s missing there but the row exists in Supabase, the write happened in **another** bucket (usually local).

## Not a gallery query bug

The keys in your 404 URLs should match `gallery_items.r2_key`. The failure is **object missing in the R2 bucket the server is configured to use**, not bad SQL or `encodeURIComponent` for normal ASCII keys.

## Works on localhost but not on Vercel (large videos)

Vercel serverless responses are limited to **~4.5MB** per response body. `/api/media` streams full objects from R2 (no full-file buffer) so **MP4s larger than that** can load in production. If you still see failures:

- Confirm the object exists in the **same** R2 bucket as Vercel’s `R2_*` env (see above).
- Range (`206`) responses use small chunks and are unaffected by the size cap.
