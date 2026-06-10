"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({
  targetUserId,
  initialFollowing,
  isLoggedIn,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        setFollowing(!following);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const label = following
    ? hovered ? "Unfollow" : "Following"
    : "Follow";

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
      className={`text-xs font-semibold px-4 py-1.5 rounded border transition-colors disabled:opacity-50 ${
        following
          ? hovered
            ? "border-red-500 text-red-400 bg-red-500/10"
            : "border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/10"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-white/40 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
