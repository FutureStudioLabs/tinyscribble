import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets, images, Stripe webhooks.
     * Skip /api/media — gallery loads many thumbnails in parallel; running Supabase
     * session refresh on each request can race on Set-Cookie and break images in prod.
     * Media proxy does not use auth (key is the capability).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/media|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
