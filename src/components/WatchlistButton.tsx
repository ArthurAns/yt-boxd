"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded border transition-colors disabled:opacity-50 ${
        inWatchlist
          ? "bg-[var(--accent-green)]/10 border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-red-500/10 hover:border-red-400 hover:text-red-400"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-white/30 hover:text-white"
      }`}
      aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
    >
      <span>{inWatchlist ? "✓" : "+"}</span>
      <span>{inWatchlist ? "In watchlist" : "Add to watchlist"}</span>
    </button>
  );
}
