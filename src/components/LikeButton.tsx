"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

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
      className={cn(
        "group inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-50",
        liked ? "text-primary" : "text-faint hover:text-primary"
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          "size-3.5 transition-transform group-active:scale-125",
          liked && "fill-current"
        )}
      />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
