import { redirect } from "next/navigation";

export const metadata = {
  title: "Welcome — TinyScribble",
  description: "Finish signing in after checkout.",
};

/** Old Stripe success URL and bookmarks; forwards to combined login + OTP. */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }> | { session_id?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const sid = sp.session_id?.trim();
  if (sid) {
    redirect(`/login?session_id=${encodeURIComponent(sid)}`);
  }
  redirect("/login");
}
