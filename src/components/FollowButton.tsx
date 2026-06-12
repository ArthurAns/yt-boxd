"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function FollowButton({
  targetUserId,
  targetName,
  initialFollowing,
  isLoggedIn,
}: {
  targetUserId: string;
  targetName?: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function toggle() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const name = targetName ? ` ${targetName}` : "";
        toast(following ? `Unfollowed${name}` : `Following${name}`);
        setFollowing(!following);
        router.refresh();
      } else {
        toast("Couldn't update follow. Try again.", "error");
      }
    } catch {
      toast("Couldn't update follow. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  const label = loading
    ? "…"
    : following
    ? hovered ? "Unfollow" : "Following"
    : "Follow";

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
      aria-busy={loading}
      className={`text-xs font-semibold px-4 py-1.5 rounded border transition-colors min-w-[5.5rem] disabled:opacity-60 disabled:cursor-wait ${
        following
          ? hovered && !loading
            ? "border-red-500 text-red-400 bg-red-500/10"
            : "border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/10"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-white/40 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
