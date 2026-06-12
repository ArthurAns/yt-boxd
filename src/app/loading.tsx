import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-10 w-96 max-w-full" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <Skeleton className="h-12 w-48 mt-4" />
      </div>
    </div>
  );
}
