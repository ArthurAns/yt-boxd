"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WatchlistButton({
  youtubeId,
  initialInWatchlist,
  isLoggedIn,
}: {
  youtubeId: string;
  initialInWatchlist: boolean;
  isLoggedIn: boolean;
}) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: inWatchlist ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId }),
      });
      if (res.ok) setInWatchlist(!inWatchlist);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-medium transition-colors disabled:opacity-50 [&_svg]:size-4",
        inWatchlist
          ? "border-watched/60 bg-watched-soft text-watched hover:border-primary/60 hover:bg-primary-soft hover:text-primary"
          : "border-border-strong text-muted hover:border-white/30 hover:text-foreground"
      )}
    >
      {inWatchlist ? <BookmarkCheck /> : <Bookmark />}
      {inWatchlist ? "In watchlist" : "Watchlist"}
    </button>
  );
}
