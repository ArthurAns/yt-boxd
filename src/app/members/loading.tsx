import { Skeleton, PageHeaderSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
