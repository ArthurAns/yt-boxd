"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

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
  const toast = useToast();

  async function toggle() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (loading) return;
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
        if (data.liked) toast("Liked ♥");
      } else {
        // Revert
        setLiked(liked);
        setCount((c) => c + (liked ? 1 : -1));
        toast("Couldn't update like. Try again.", "error");
      }
    } catch {
      setLiked(liked);
      setCount((c) => c + (liked ? 1 : -1));
      toast("Couldn't update like. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-busy={loading}
      aria-label={liked ? "Unlike" : "Like"}
      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-wait ${
        loading ? "animate-pulse" : ""
      } ${
        liked ? "text-red-400 hover:text-red-300" : "text-[var(--text-dim)] hover:text-red-400"
      }`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
