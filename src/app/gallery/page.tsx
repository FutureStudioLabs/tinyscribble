import { redirect } from "next/navigation";

/** Old URL from earlier builds; dashboard tabs live under /dashboard/gallery. */
export default function GalleryRedirectPage() {
  redirect("/dashboard/gallery");
}
