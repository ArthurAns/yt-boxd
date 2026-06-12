import { Skeleton, PageHeaderSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <PageHeaderSkeleton maxWidth="max-w-2xl" />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-card)] border border-white/[0.06] rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-28 h-16 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
