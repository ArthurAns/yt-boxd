export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-white/[0.06] ${className}`}
    />
  );
}

/** Standard page header band used by every listing page. */
export function PageHeaderSkeleton({ maxWidth = "max-w-5xl" }: { maxWidth?: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <div className={`mx-auto ${maxWidth} px-4 py-6 space-y-2`}>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
