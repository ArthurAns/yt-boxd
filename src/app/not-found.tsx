import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <p className="text-[var(--accent-green)] font-bold text-7xl leading-none">
        404
      </p>
      <h1 className="text-2xl font-bold">This page is lost in the feed.</h1>
      <p className="text-sm text-[var(--text-muted)] max-w-md">
        The page you&apos;re looking for doesn&apos;t exist, or it may have
        been removed.
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          href="/"
          className="bg-[var(--accent-green)] hover:bg-[var(--accent-green-dark)] text-black font-bold px-4 py-2 rounded-md text-sm transition-colors"
        >
          Back home
        </Link>
        <Link
          href="/videos"
          className="text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-md px-4 py-2 hover:text-white hover:border-white/30 transition-colors"
        >
          Browse videos
        </Link>
      </div>
    </div>
  );
}
