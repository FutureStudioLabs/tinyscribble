import { EmailVerifiedClient } from "@/app/auth/email-verified/EmailVerifiedClient";
import { Suspense } from "react";

export const metadata = {
  title: "You're signed in — TinyScribble",
  description: "Email sign-in verified. Return to your other TinyScribble tab.",
};

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#FFF8F5] text-[#6B6B6B]">
          Loading…
        </div>
      }
    >
      <EmailVerifiedClient />
    </Suspense>
  );
}
