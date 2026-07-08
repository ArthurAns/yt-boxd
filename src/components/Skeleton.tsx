export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`}
    />
  );
}

/** Standard page header placeholder used by every listing page. */
export function PageHeaderSkeleton({ maxWidth = "max-w-6xl" }: { maxWidth?: string }) {
  return (
    <div className={`mx-auto ${maxWidth} px-4 pt-10 pb-6 space-y-3`}>
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
