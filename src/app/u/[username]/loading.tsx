import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-inset">
        <div className="mx-auto max-w-5xl px-4 py-8 flex items-end gap-6">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-4 flex gap-8">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-14" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-3 w-28" />
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Skeleton className="w-24 h-14 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
