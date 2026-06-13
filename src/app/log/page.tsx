"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewForm } from "@/components/LogModal";

function LogPageContent() {
  const searchParams = useSearchParams();
  const v = searchParams.get("v") ?? "";
  return <ReviewForm initialYoutubeId={v} />;
}

export default function LogPage() {
  return (
    <Suspense>
      <LogPageContent />
    </Suspense>
  );
}
