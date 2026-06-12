"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <p className="text-[var(--accent-green)] font-bold text-5xl leading-none" aria-hidden="true">
        ⚠
      </p>
      <h1 className="text-2xl font-bold">Something went wrong.</h1>
      <p className="text-sm text-[var(--text-muted)] max-w-md">
        An unexpected error occurred while loading this page. It&apos;s not
        you, it&apos;s us — try again in a moment.
        {error.digest && (
          <span className="block mt-2 text-xs text-[var(--text-dim)]">
            Error reference: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => unstable_retry()}
          className="bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-bold px-4 py-2 rounded-md text-sm transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-md px-4 py-2 hover:text-white hover:border-white/30 transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
