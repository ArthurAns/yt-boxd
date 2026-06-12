import { Skeleton, PageHeaderSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-white/[0.06] rounded-lg p-4 space-y-3"
            >
              <Skeleton className="aspect-[4/1] w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
