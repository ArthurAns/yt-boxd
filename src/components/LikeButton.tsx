"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LikeButton({
  diaryEntryId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  diaryEntryId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setLoading(true);
    // Optimistic update
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch("/api/likes", {
        method: liked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diaryEntryId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      } else {
        // Revert
        setLiked(liked);
        setCount((c) => c + (liked ? 1 : -1));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
        liked ? "text-red-400 hover:text-red-300" : "text-[var(--text-dim)] hover:text-red-400"
      }`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <span>{liked ? "♥" : "♡"}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
