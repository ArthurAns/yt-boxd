import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-inset">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Skeleton className="w-24 h-14 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
