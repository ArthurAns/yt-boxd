"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

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
      className={cn(
        "h-8 min-w-[5.5rem] rounded-lg px-4 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60",
        following
          ? hovered && !loading
            ? "border border-primary/60 bg-primary-soft text-primary"
            : "border border-border-strong bg-card text-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary-hover"
      )}
    >
      {label}
    </button>
  );
}
