import { Suspense } from "react";
import { DashboardUploadClient } from "./DashboardUploadClient";

function DashboardUploadFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-md flex-1 animate-pulse rounded-2xl bg-[#F5F0EC]/90 py-24" />
    </div>
  );
}

export default function DashboardUploadPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<DashboardUploadFallback />}>
        <DashboardUploadClient />
      </Suspense>
    </main>
  );
}
