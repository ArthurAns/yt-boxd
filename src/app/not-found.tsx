import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-7xl font-bold leading-none text-primary">
        404
      </p>
      <h1 className="font-display text-2xl font-bold">This page is lost in the feed.</h1>
      <p className="max-w-md text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or it may have
        been removed.
      </p>
      <div className="mt-2 flex gap-3">
        <Link href="/" className={buttonVariants()}>
          Back home
        </Link>
        <Link href="/videos" className={buttonVariants({ variant: "outline" })}>
          Browse videos
        </Link>
      </div>
    </div>
  );
}
