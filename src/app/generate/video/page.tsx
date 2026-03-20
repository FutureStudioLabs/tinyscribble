import { Suspense } from "react";
import { GenerateVideoPageClient } from "./GenerateVideoPageClient";

export default function GenerateVideoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100vh] min-h-[100vh] flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F5] to-[#FFE8E0] px-5">
          <p className="text-sm text-[#6B6B6B]" style={{ fontFamily: "var(--font-body)" }}>
            Loading…
          </p>
        </div>
      }
    >
      <GenerateVideoPageClient />
    </Suspense>
  );
}
