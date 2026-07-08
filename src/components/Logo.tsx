import Link from "next/link";
import { cn } from "@/lib/utils";

/** Brand mark: coral play-tile + lowercase wordmark. */
export default function Logo({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "lg";
}) {
  const tile = size === "lg" ? "size-8 rounded-[10px]" : "size-6 rounded-lg";
  const glyph = size === "lg" ? "border-l-[12px] border-y-[7px]" : "border-l-[9px] border-y-[5.5px]";
  const word = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <Link
      href="/"
      aria-label="ytboxd — home"
      className={cn("group inline-flex items-center gap-2", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center bg-primary transition-colors group-hover:bg-primary-hover",
          tile
        )}
      >
        <span className={cn("ml-0.5 border-y-transparent border-l-primary-foreground", glyph)} />
      </span>
      <span className={cn("font-display font-bold tracking-tight text-foreground", word)}>
        yt<span className="text-muted">boxd</span>
      </span>
    </Link>
  );
}
