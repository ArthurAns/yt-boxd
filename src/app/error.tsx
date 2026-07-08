"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="size-12 text-primary" aria-hidden="true" />
      <h1 className="font-display text-2xl font-bold">Something went wrong.</h1>
      <p className="max-w-md text-sm text-muted">
        An unexpected error occurred while loading this page. It&apos;s not
        you, it&apos;s us — try again in a moment.
        {error.digest && (
          <span className="mt-2 block text-xs text-faint">
            Error reference: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-2 flex gap-3">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back home
        </Link>
      </div>
    </div>
  );
}
