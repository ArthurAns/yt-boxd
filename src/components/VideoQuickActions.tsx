"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Heart, Star, PenLine } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLogModal } from "@/components/LogModal";
import StarRating from "@/components/StarRating";
import { cn } from "@/lib/utils";

type UndatedEntry = { id: string; liked: boolean; rating: number | null } | null;

// ─── Inline star picker popover ───────────────────────────────────────────────

function InlineStarPicker({
  value,
  onChange,
  onClose,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-border-strong bg-popover p-3 shadow-2xl animate-zoom-in"
    >
      <StarRating value={value} onChange={onChange} size={28} />
      {value !== null && (
        <p className="mt-1.5 text-center text-xs text-faint">
          {value}★ — click to change
        </p>
      )}
    </div>
  );
}

// ─── Action chip ──────────────────────────────────────────────────────────────

function ActionChip({
  active,
  activeClass,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50 [&_svg]:size-4",
        active
          ? activeClass
          : "border-border-strong text-muted hover:border-white/30 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VideoQuickActions({
  youtubeId,
  undatedEntry: initialUndatedEntry,
  hasDatedEntry,
  isLoggedIn,
}: {
  youtubeId: string;
  undatedEntry: UndatedEntry;
  hasDatedEntry: boolean;
  isLoggedIn: boolean;
}) {
  const [entry, setEntry] = useState<UndatedEntry>(initialUndatedEntry);
  const [busy, setBusy] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { open: openLogModal } = useLogModal();

  const isWatched = entry !== null || hasDatedEntry;
  const isLiked = entry?.liked ?? false;
  const currentRating = entry?.rating ?? null;

  const callApi = useCallback(
    async (action: string, rating?: number) => {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId, action, ...(rating !== undefined && { rating }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      return data.entry as UndatedEntry;
    },
    [youtubeId]
  );

  async function handle(action: string, rating?: number) {
    if (!isLoggedIn) { router.push("/login"); return; }
    setBusy(true);
    try {
      const updated = await callApi(action, rating);
      setEntry(updated);
      router.refresh();
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleWatch() {
    if (isWatched) {
      if (!entry && hasDatedEntry) {
        toast("Remove your diary entry to unmark as watched", "error");
        return;
      }
      await handle("unwatch");
    } else {
      await handle("watch");
    }
  }

  async function handleRate(rating: number | null) {
    setRatingOpen(false);
    if (rating === null) {
      await handle("unrate");
    } else {
      await handle("rate", rating);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Watched */}
      <ActionChip
        onClick={toggleWatch}
        disabled={busy}
        aria-pressed={isWatched}
        active={isWatched}
        activeClass="border-watched/60 bg-watched-soft text-watched hover:border-primary/60 hover:bg-primary-soft hover:text-primary"
      >
        <Eye />
        Watched
      </ActionChip>

      {/* Like */}
      <ActionChip
        onClick={() => handle(isLiked ? "unlike" : "like")}
        disabled={busy}
        aria-pressed={isLiked}
        active={isLiked}
        activeClass="border-primary/60 bg-primary-soft text-primary"
      >
        <Heart className={isLiked ? "fill-current" : ""} />
        Like
      </ActionChip>

      {/* Rate */}
      <div className="relative">
        <ActionChip
          onClick={() => {
            if (!isLoggedIn) { router.push("/login"); return; }
            setRatingOpen((v) => !v);
          }}
          disabled={busy}
          aria-expanded={ratingOpen}
          active={currentRating !== null}
          activeClass="border-star/60 bg-star-soft text-star"
        >
          <Star className={currentRating !== null ? "fill-current" : ""} />
          {currentRating !== null ? `${currentRating}★` : "Rate"}
        </ActionChip>
        {ratingOpen && (
          <InlineStarPicker
            value={currentRating}
            onChange={handleRate}
            onClose={() => setRatingOpen(false)}
          />
        )}
      </div>

      {/* Review */}
      <ActionChip
        onClick={() => {
          if (!isLoggedIn) { router.push("/login"); return; }
          openLogModal(youtubeId);
        }}
      >
        <PenLine />
        Review
      </ActionChip>
    </div>
  );
}
